import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types';

const SEED: User[] = [
  {
    id: 'u1',
    email: 'buyer@fashion.cn',
    firstName: 'Li',
    lastName: 'Wei',
    phoneNumber: '+86 138 0000 1122',
    country: 'China',
    countryCode: 'CN',
    company: 'Guangzhou Retail Co.',
    roles: ['User'],
  },
  {
    id: 'u2',
    email: 'partner@fashion.uz',
    firstName: 'Dilshod',
    lastName: 'Karimov',
    phoneNumber: '+998 90 111 2233',
    country: 'Uzbekistan',
    countryCode: 'UZ',
    roles: ['User'],
  },
  {
    id: 'u3',
    email: 'buyer@baku.az',
    firstName: 'Leyla',
    lastName: 'Mammadova',
    phoneNumber: '+994 50 123 4567',
    country: 'Azerbaijan',
    countryCode: 'AZ',
    roles: ['User'],
  },
  {
    id: 'admin-local',
    email: 'admin@zeir.cn',
    firstName: 'Admin',
    lastName: 'ZEIR',
    phoneNumber: '+86 20 0000 0000',
    country: 'China',
    countryCode: 'CN',
    company: 'EKR',
    roles: ['Admin'],
  },
];

interface UsersState {
  users: User[];
}

const initialState: UsersState = { users: SEED };

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    addUser(state, action: PayloadAction<User>) {
      state.users = [action.payload, ...state.users];
    },
    removeUser(state, action: PayloadAction<string>) {
      state.users = state.users.filter((u) => u.id !== action.payload);
    },
    upsertUser(state, action: PayloadAction<User>) {
      const exists = state.users.some((u) => u.id === action.payload.id);
      state.users = exists
        ? state.users.map((u) => (u.id === action.payload.id ? action.payload : u))
        : [action.payload, ...state.users];
    },
  },
});

export const { addUser, removeUser, upsertUser } = usersSlice.actions;
export default usersSlice.reducer;

export const selectUsers = (state: { users: UsersState }) => state.users.users;
