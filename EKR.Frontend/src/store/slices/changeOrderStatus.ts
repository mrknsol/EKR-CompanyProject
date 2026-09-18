import { createAsyncThunk } from '@reduxjs/toolkit';
import type { OrderStatus } from '../../types';
import type { RootState } from '../index';
import { changeOrderStatusRemote } from './ordersSlice';
import { addNotification } from './notificationSlice';
import {
  broadcastNotification,
  buildStatusNotification,
  showBrowserNotification,
} from '../../components/browserNotify';

export const changeOrderStatus = createAsyncThunk(
  'orders/changeStatus',
  async (
    { id, status }: { id: string; status: OrderStatus },
    { getState, dispatch }
  ) => {
    const state = getState() as RootState;
    const order = state.orders.orders.find((o) => o.id === id);
    if (!order || order.status === status) return null;

    const updated = await dispatch(changeOrderStatusRemote({ id, status })).unwrap();

    const lang = state.locale.lang ?? 'en';
    const notification = buildStatusNotification({
      orderId: updated.id,
      userId: updated.userId,
      userEmail: updated.customer.email,
      status: updated.status,
      lang,
    });

    // Always broadcast for other tabs; customer browsers pick up via API polling.
    broadcastNotification(notification);

    const me = state.auth.session?.user;
    const isOwner =
      !!me &&
      ((updated.userId && me.id === updated.userId) ||
        me.email.toLowerCase() === (updated.customer.email || '').toLowerCase());

    if (isOwner) {
      dispatch(addNotification(notification));
      showBrowserNotification(notification.title, notification.body, notification.orderId);
    }

    return notification;
  }
);
