import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectIsAdmin, selectSession } from '../store/slices/authSlice';
import { selectLang } from '../store/slices/localeSlice';
import { addNotification } from '../store/slices/notificationSlice';
import {
  fetchAllOrders,
  fetchMyOrders,
  selectOrders,
} from '../store/slices/ordersSlice';
import {
  buildAdminNewOrderNotification,
  buildAdminPaymentNotification,
  buildStatusNotification,
  readAdminOrdersMap,
  readStatusMap,
  showBrowserNotification,
  writeAdminOrdersMap,
  writeStatusMap,
} from '../components/browserNotify';
import type { OrderStatus } from '../types';

const POLL_MS = 8000;

/** Polls API and notifies customer / admin about order changes. */
export function useOrderStatusWatcher() {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectSession);
  const isAdmin = useAppSelector(selectIsAdmin);
  const orders = useAppSelector(selectOrders);
  const lang = useAppSelector(selectLang);
  const primedCustomer = useRef(false);
  const primedAdmin = useRef(false);

  // ——— Customer: seed + status-change notifications ———
  useEffect(() => {
    if (!session || isAdmin || orders.length === 0) return;
    if (primedCustomer.current) return;
    const map = readStatusMap();
    let changed = false;
    for (const o of orders) {
      if (!map[o.id]) {
        map[o.id] = o.status;
        changed = true;
      }
    }
    if (changed) writeStatusMap(map);
    primedCustomer.current = true;
  }, [session, isAdmin, orders]);

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

  // ——— Admin: seed + new order / payment notifications ———
  useEffect(() => {
    if (!session || !isAdmin || orders.length === 0) return;
    if (primedAdmin.current) return;
    const map = readAdminOrdersMap();
    let changed = false;
    for (const o of orders) {
      if (!map[o.id]) {
        map[o.id] = o.status;
        changed = true;
      }
    }
    if (changed) writeAdminOrdersMap(map);
    primedAdmin.current = true;
  }, [session, isAdmin, orders]);

  useEffect(() => {
    if (!session || !isAdmin) return;
    if (!primedAdmin.current && orders.length === 0) return;

    const map = readAdminOrdersMap();
    let changed = false;

    for (const order of orders) {
      const prev = map[order.id];
      const customerName =
        `${order.customer.firstName} ${order.customer.lastName}`.trim() ||
        order.customer.email ||
        '—';

      if (!prev) {
        // New order appeared after prime
        if (primedAdmin.current) {
          const ntf = buildAdminNewOrderNotification({
            orderId: order.id,
            customerName,
            userEmail: order.customer.email || session.user.email,
            lang,
          });
          dispatch(addNotification(ntf));
          showBrowserNotification(ntf.title, ntf.body, ntf.orderId);
        }
        map[order.id] = order.status;
        changed = true;
        continue;
      }

      if (prev !== order.status) {
        if (order.status === 'paid' && prev === 'ready') {
          const ntf = buildAdminPaymentNotification({
            orderId: order.id,
            customerName,
            userEmail: order.customer.email || session.user.email,
            lang,
          });
          dispatch(addNotification(ntf));
          showBrowserNotification(ntf.title, ntf.body, ntf.orderId);
        }
        map[order.id] = order.status;
        changed = true;
      }
    }

    if (changed) writeAdminOrdersMap(map);
  }, [orders, session, isAdmin, lang, dispatch]);

  // Poll
  useEffect(() => {
    if (!session?.token) return;

    const tick = () => {
      void dispatch(isAdmin ? fetchAllOrders() : fetchMyOrders());
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
