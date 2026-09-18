import { api } from './client';
import type { AuthSession, User, UserRole } from '../types';

interface AuthResponseDTO {
  token: string;
  tokenExpiry: string;
  refreshToken: string;
  refreshTokenExpiry: string;
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
}

interface ProfileDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  country: string;
  roles: string[];
}

interface ApiEnvelope<T> {
  success?: boolean;
  Success?: boolean;
  data?: T;
  Data?: T;
  message?: string;
  Message?: string;
}

function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === 'object' && ('data' in payload || 'Data' in payload)) {
    const env = payload as ApiEnvelope<T>;
    return (env.data ?? env.Data) as T;
  }
  return payload as T;
}

function mapAuth(dto: AuthResponseDTO): AuthSession {
  const [firstName = '', ...rest] = (dto.fullName || '').split(' ');
  const user: User = {
    id: dto.userId,
    email: dto.email,
    firstName,
    lastName: rest.join(' '),
    phoneNumber: '',
    country: '',
    countryCode: '',
    roles: (dto.roles ?? []) as UserRole[],
  };
  return {
    token: dto.token,
    refreshToken: dto.refreshToken,
    tokenExpiry: String(dto.tokenExpiry),
    user,
  };
}

function mapProfile(dto: ProfileDTO, session: AuthSession): AuthSession {
  return {
    ...session,
    user: {
      ...session.user,
      id: dto.id || session.user.id,
      email: dto.email || session.user.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber ?? '',
      country: dto.country ?? '',
      roles: (dto.roles?.length ? dto.roles : session.user.roles) as UserRole[],
    },
  };
}

export async function loginRequest(email: string, password: string): Promise<AuthSession> {
  try {
    const { data } = await api.post<ApiEnvelope<AuthResponseDTO>>('/Auth/login', {
      email,
      password,
    });
    const payload = unwrap(data);
    if (!payload?.token) {
      throw new Error(
        (data as ApiEnvelope<AuthResponseDTO>)?.message ||
          (data as ApiEnvelope<AuthResponseDTO>)?.Message ||
          'Login failed'
      );
    }
    return mapAuth(payload);
  } catch (err: unknown) {
    const ax = err as {
      code?: string;
      message?: string;
      response?: { status?: number; data?: { message?: string; Message?: string } };
    };
    if (!ax.response) {
      throw new Error(
        'API недоступен (http://localhost:5015). Запусти бэкенд: cd EKR.Presentation && dotnet run'
      );
    }
    throw new Error(
      ax.response.data?.message ||
        ax.response.data?.Message ||
        ax.message ||
        `Login failed (${ax.response.status})`
    );
  }
}

export async function registerRequest(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  country: string;
}): Promise<AuthSession> {
  const { data } = await api.post<ApiEnvelope<AuthResponseDTO>>('/Auth/register', {
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    password: payload.password,
    confirmPassword: payload.confirmPassword,
    phoneNumber: payload.phoneNumber,
    country: payload.country,
  });
  return mapAuth(unwrap(data));
}

export async function refreshRequest(refreshToken: string): Promise<AuthSession> {
  const { data } = await api.post<ApiEnvelope<AuthResponseDTO>>('/Auth/refresh', {
    refreshToken,
  });
  return mapAuth(unwrap(data));
}

export async function logoutRequest(): Promise<void> {
  await api.post('/Auth/logout');
}

export async function fetchMeRequest(session: AuthSession): Promise<AuthSession> {
  const { data } = await api.get<ApiEnvelope<ProfileDTO>>('/Account/me');
  return mapProfile(unwrap(data), session);
}

export async function updateProfileRequest(
  session: AuthSession,
  payload: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    country: string;
  }
): Promise<AuthSession> {
  const { data } = await api.put<ApiEnvelope<ProfileDTO>>('/Account/profile', {
    firstName: payload.firstName,
    lastName: payload.lastName,
    phoneNumber: payload.phoneNumber,
    country: payload.country,
  });
  return mapProfile(unwrap(data), session);
}
