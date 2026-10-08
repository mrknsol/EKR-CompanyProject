import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useT } from '../hooks/useT';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectIsAdmin, selectSession } from '../store/slices/authSlice';
import {
  addNotification,
  clearNotifications,
  markAllRead,
  markRead,
  selectMyNotifications,
  selectUnreadCount,
  setPermissionAsked,
} from '../store/slices/notificationSlice';
import {
  getNotificationPermission,
  readAdminOrdersMap,
  requestNotificationPermission,
  showBrowserNotification,
  subscribeNotifications,
  writeAdminOrdersMap,
} from './browserNotify';
import './notificationBell.css';

export function NotificationBell() {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectSession);
  const isAdmin = useAppSelector(selectIsAdmin);
  const t = useT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const userId = session?.user.id;
  const email = session?.user.email;
  const items = useAppSelector(selectMyNotifications(userId, email, isAdmin));
  const unread = useAppSelector(selectUnreadCount(userId, email, isAdmin));
  const permission = getNotificationPermission();

  useEffect(() => {
    const unsub = subscribeNotifications((notification) => {
      const forAdmin = notification.audience === 'admin';
      if (forAdmin && !isAdmin) return;
      if (!forAdmin && isAdmin) return;

      if (!forAdmin) {
        const mine =
          (userId && notification.userId === userId) ||
          (email && notification.userEmail.toLowerCase() === email.toLowerCase());
        if (!mine) return;
      }

      dispatch(addNotification(notification));
      showBrowserNotification(notification.title, notification.body, notification.orderId);

      // Keep admin poll map in sync so we don't double-notify on next fetch
      if (forAdmin && isAdmin && notification.orderId) {
        const map = readAdminOrdersMap();
        map[notification.orderId] = notification.status;
        writeAdminOrdersMap(map);
      }
    });
    return unsub;
  }, [dispatch, userId, email, isAdmin]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  if (!session) return null;

  async function enablePush() {
    const result = await requestNotificationPermission();
    dispatch(setPermissionAsked(true));
    if (result === 'granted') {
      await showBrowserNotification('ZEIR', t('notif_enabled'));
    }
  }

  return (
    <div className="notif-bell" ref={rootRef}>
      <button
        type="button"
        className="icon-btn"
        aria-label={t('notif_title')}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={18} />
        {unread > 0 && <span className="cart-dot">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel card-surface">
          <div className="notif-panel-head">
            <strong>{t('notif_title')}</strong>
            <div className="notif-panel-actions">
              {items.some((n) => !n.read) && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => dispatch(markAllRead({ userId, email, isAdmin }))}
                >
                  {t('notif_mark_all')}
                </button>
              )}
              {items.length > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => dispatch(clearNotifications({ userId, email, isAdmin }))}
                >
                  {t('notif_clear')}
                </button>
              )}
            </div>
          </div>

          {permission === 'granted' && (
            <div className="notif-permission">
              <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
                {t('notif_os_hint')}
              </p>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => void showBrowserNotification('ZEIR', t('notif_test'))}
              >
                {t('notif_test')}
              </button>
            </div>
          )}

          {permission === 'default' && (
            <div className="notif-permission">
              <p>{t('notif_permission_hint')}</p>
              <button type="button" className="btn btn-primary" onClick={() => void enablePush()}>
                {t('notif_enable')}
              </button>
            </div>
          )}

          {permission === 'denied' && (
            <p className="muted notif-denied">{t('notif_denied')}</p>
          )}

          {items.length === 0 ? (
            <p className="muted notif-empty">{t('notif_empty')}</p>
          ) : (
            <ul className="notif-list">
              {items.map((n) => (
                <li key={n.id} className={n.read ? '' : 'is-unread'}>
                  <button
                    type="button"
                    className="notif-item"
                    onClick={() => {
                      dispatch(markRead(n.id));
                      setOpen(false);
                    }}
                  >
                    <span className="notif-item-body">{n.body}</span>
                    <span className="muted notif-item-time">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </button>
                  <Link
                    to={isAdmin ? '/admin/orders' : `/orders/${n.orderId}`}
                    className="notif-link"
                    onClick={() => {
                      dispatch(markRead(n.id));
                      setOpen(false);
                    }}
                  >
                    {t('notif_open_order')}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
