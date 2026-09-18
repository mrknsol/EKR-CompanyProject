import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectIsAdmin, selectSession } from '../store/slices/authSlice';
import { selectLang } from '../store/slices/localeSlice';
import { addNotification } from '../store/slices/notificationSlice';
import { fetchMyOrders, selectOrders } from '../store/slices/ordersSlice';
import {
  buildStatusNotification,
  readStatusMap,
  showBrowserNotification,
  writeStatusMap,
} from '../components/browserNotify';
import type { OrderStatus } from '../types';

const POLL_MS = 8000;

/** Polls API for my orders and creates notifications when status changes. */
export function useOrderStatusWatcher() {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectSession);
  const isAdmin = useAppSelector(selectIsAdmin);
  const orders = useAppSelector(selectOrders);
  const lang = useAppSelector(selectLang);
  const primed = useRef(false);

  // Seed status map once when orders first load (avoid notifying for existing statuses)
  useEffect(() => {
    if (!session || isAdmin || orders.length === 0) return;
    if (primed.current) return;
    const map = readStatusMap();
    let changed = false;
    for (const o of orders) {
      if (!map[o.id]) {
        map[o.id] = o.status;
        changed = true;
      }
    }
    if (changed) writeStatusMap(map);
    primed.current = true;
  }, [session, isAdmin, orders]);

  // Detect status diffs whenever orders update
  useEffect(() => {
    if (!session || isAdmin) return;
    const map = readStatusMap();
    let changed = false;

    for (const order of orders) {
      const prev = map[order.id];
      if (prev && prev !== order.status) {
        const notification = buildStatusNotification({
          orderId: order.id,
          userId: order.userId ?? session.user.id,
          userEmail: order.customer.email || session.user.email,
          status: order.status as OrderStatus,
          lang,
        });
        dispatch(addNotification(notification));
        showBrowserNotification(notification.title, notification.body, notification.orderId);
      }
      if (map[order.id] !== order.status) {
        map[order.id] = order.status;
        changed = true;
      }
    }

    if (changed) writeStatusMap(map);
  }, [orders, session, isAdmin, lang, dispatch]);

  // Poll my orders while logged in as customer
  useEffect(() => {
    if (!session?.token || isAdmin) return;

    const tick = () => {
      void dispatch(fetchMyOrders());
    };

    const id = window.setInterval(tick, POLL_MS);
    const onFocus = () => tick();
    window.addEventListener('focus', onFocus);

    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [dispatch, session?.token, isAdmin]);
}
