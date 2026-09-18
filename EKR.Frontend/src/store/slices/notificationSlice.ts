import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AppNotification } from '../../components/browserNotify';

interface NotificationsState {
    items: AppNotification[];
    permissionAsked: boolean;
}

const initialState: NotificationsState = {
    items: [],
    permissionAsked: false,
}

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification(state, action: PayloadAction<AppNotification>) {
            if (state.items.some((n) => n.id === action.payload.id)) return;
            state.items = [action.payload, ...state.items].slice(0,50);
        },
        markRead(state, action: PayloadAction<string>) {
            const item = state.items.find((n) => n.id === action.payload);
            if (item) item.read = true;
        },
        markAllRead(state, action: PayloadAction<{ userId?: string; email?: string }>) {
            const { userId, email } = action.payload;
            for (const item of state.items) {
                const mine =
                    (userId && item.userId === userId) ||
                    (email && item.userEmail.toLowerCase() === email.toLowerCase());
                if (mine) item.read = true;
            }
        },
        clearNotifications(state, action: PayloadAction<{ userId?: string; email?: string }>) {
            const { userId, email } = action.payload;
            state.items = state.items.filter((item) => {
                const mine =
                    (userId && item.userId === userId) ||
                    (email && item.userEmail.toLowerCase() === email.toLowerCase());
                return !mine;
            });
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
    (userId?: string, email?: string) =>
    (state: { notifications: NotificationsState }) =>
      state.notifications.items.filter(
        (n) =>
          (userId && n.userId === userId) ||
          (email && n.userEmail.toLowerCase() === email.toLowerCase())
      );

export const selectUnreadCount =
    (userId?: string, email?: string) =>
    (state: { notifications: NotificationsState }) =>
      selectMyNotifications(userId, email)(state).filter((n) => !n.read).length;
  