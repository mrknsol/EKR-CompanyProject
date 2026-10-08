import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AppNotification } from '../../components/browserNotify';

interface NotificationsState {
  items: AppNotification[];
  permissionAsked: boolean;
}

const initialState: NotificationsState = {
  items: [],
  permissionAsked: false,
};

function isMine(
  item: AppNotification,
  opts: { userId?: string; email?: string; isAdmin?: boolean }
) {
  if (item.audience === 'admin') return !!opts.isAdmin;
  if (opts.isAdmin) return false;
  return (
    (!!opts.userId && item.userId === opts.userId) ||
    (!!opts.email && item.userEmail.toLowerCase() === opts.email.toLowerCase())
  );
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<AppNotification>) {
      if (state.items.some((n) => n.id === action.payload.id)) return;
      state.items = [action.payload, ...state.items].slice(0, 50);
    },
    markRead(state, action: PayloadAction<string>) {
      const item = state.items.find((n) => n.id === action.payload);
      if (item) item.read = true;
    },
    markAllRead(
      state,
      action: PayloadAction<{ userId?: string; email?: string; isAdmin?: boolean }>
    ) {
      for (const item of state.items) {
        if (isMine(item, action.payload)) item.read = true;
      }
    },
    clearNotifications(
      state,
      action: PayloadAction<{ userId?: string; email?: string; isAdmin?: boolean }>
    ) {
      state.items = state.items.filter((item) => !isMine(item, action.payload));
    },
    setPermissionAsked(state, action: PayloadAction<boolean>) {
      state.permissionAsked = action.payload;
    },
  },
});

export const {
  addNotification,
  markRead,
  markAllRead,
  clearNotifications,
  setPermissionAsked,
} = notificationsSlice.actions;
export default notificationsSlice.reducer;

export const selectNotifications = (state: { notifications: NotificationsState }) =>
  state.notifications.items;

export const selectPermissionAsked = (state: { notifications: NotificationsState }) =>
  state.notifications.permissionAsked;

export const selectMyNotifications =
  (userId?: string, email?: string, isAdmin?: boolean) =>
  (state: { notifications: NotificationsState }) =>
    state.notifications.items.filter((n) => isMine(n, { userId, email, isAdmin }));

export const selectUnreadCount =
  (userId?: string, email?: string, isAdmin?: boolean) =>
  (state: { notifications: NotificationsState }) =>
    selectMyNotifications(userId, email, isAdmin)(state).filter((n) => !n.read).length;
