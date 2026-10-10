import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthSession, User, UserRole } from '../../types';
import {
  fetchMeRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  updateProfileRequest,
} from '../../api/auth';
import { setAuthTokens } from '../../api/client';
import { countryByCode } from '../../data/countries';

interface AuthState {
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  session: null,
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const session = await loginRequest(email, password);
    try {
      return await fetchMeRequest(session);
    } catch {
      return session;
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phoneNumber: string;
    country: string;
    countryCode: string;
  }) => {
    const session = await registerRequest(payload);
    session.user.country = payload.country;
    session.user.countryCode = payload.countryCode;
    session.user.phoneNumber = payload.phoneNumber;
    if (countryByCode(payload.countryCode)) {
      session.user.country = payload.country;
    }
    try {
      return await fetchMeRequest(session);
    } catch {
      return session;
    }
  }
);

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { getState, rejectWithValue }) => {
  const state = getState() as { auth: AuthState };
  if (!state.auth.session) return rejectWithValue('Not authenticated');
  try {
    return await fetchMeRequest(state.auth.session);
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 401) return rejectWithValue('unauthorized');
    throw err;
  }
});

export const saveProfile = createAsyncThunk(
  'auth/saveProfile',
  async (
    payload: {
      firstName: string;
      lastName: string;
      phoneNumber: string;
      country: string;
      countryCode: string;
      company?: string;
    },
    { getState }
  ) => {
    const state = getState() as { auth: AuthState };
    if (!state.auth.session) throw new Error('Not authenticated');
    const session = await updateProfileRequest(state.auth.session, {
      firstName: payload.firstName,
      lastName: payload.lastName,
      phoneNumber: payload.phoneNumber,
      country: payload.country,
    });
    session.user.countryCode = payload.countryCode;
    if (payload.company !== undefined) session.user.company = payload.company;
    return session;
  }
);

export const logoutAsync = createAsyncThunk('auth/logoutAsync', async (_, { getState }) => {
  const state = getState() as { auth: AuthState };
  if (state.auth.session?.token) {
    try {
      await logoutRequest();
    } catch {
      /* ignore network errors on logout */
    }
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    updateProfile(state, action: PayloadAction<Partial<User>>) {
      if (!state.session) return;
      state.session = {
        ...state.session,
        user: { ...state.session.user, ...action.payload },
      };
    },
    logout(state) {
      state.session = null;
      state.error = null;
      setAuthTokens(null, null);
    },
    setSession(state, action: PayloadAction<AuthSession>) {
      state.session = action.payload;
      state.loading = false;
      state.error = null;
      setAuthTokens(action.payload.token, action.payload.refreshToken);
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.session = action.payload;
        setAuthTokens(action.payload.token, action.payload.refreshToken);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Login failed';
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.session = action.payload;
        setAuthTokens(action.payload.token, action.payload.refreshToken);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Registration failed';
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.session = action.payload;
        setAuthTokens(action.payload.token, action.payload.refreshToken);
      })
      .addCase(fetchMe.rejected, (state, action) => {
        if (action.payload === 'unauthorized' || action.payload === 'Not authenticated') {
          state.session = null;
          setAuthTokens(null, null);
        }
      })
      .addCase(saveProfile.fulfilled, (state, action) => {
        state.session = action.payload;
        setAuthTokens(action.payload.token, action.payload.refreshToken);
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.session = null;
        state.error = null;
        setAuthTokens(null, null);
      })
      .addCase(logoutAsync.rejected, (state) => {
        state.session = null;
        state.error = null;
        setAuthTokens(null, null);
      });
  },
});

export const { updateProfile, logout, setSession, clearAuthError } = authSlice.actions;
export default authSlice.reducer;

export const selectSession = (state: { auth: AuthState }) => state.auth.session;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectUser = (state: { auth: AuthState }) => state.auth.session?.user ?? null;
export const selectIsAdmin = (state: { auth: AuthState }) => {
  const roles = state.auth.session?.user.roles ?? [];
  return roles.includes('Admin' as UserRole) || roles.includes('Manager' as UserRole);
};
