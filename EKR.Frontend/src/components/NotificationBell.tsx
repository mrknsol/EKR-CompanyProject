import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useT } from '../hooks/useT';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectSession } from '../store/slices/authSlice';
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
  requestNotificationPermission,
  showBrowserNotification,
  subscribeNotifications,
} from './browserNotify';
import './notificationBell.css';

export function NotificationBell() {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectSession);
  const t = useT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const userId = session?.user.id;
  const email = session?.user.email;
  const items = useAppSelector(selectMyNotifications(userId, email));
  const unread = useAppSelector(selectUnreadCount(userId, email));
  const permission = getNotificationPermission();

  useEffect(() => {
    const unsub = subscribeNotifications((notification) => {
      dispatch(addNotification(notification));
      const mine =
        (userId && notification.userId === userId) ||
        (email && notification.userEmail.toLowerCase() === email.toLowerCase());
      if (mine) {
        showBrowserNotification(notification.title, notification.body, notification.orderId);
      }
    });
    return unsub;
  }, [dispatch, userId, email]);

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
                  onClick={() => dispatch(markAllRead({ userId, email }))}
                >
                  {t('notif_mark_all')}
                </button>
              )}
              {items.length > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => dispatch(clearNotifications({ userId, email }))}
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
                    to="/profile"
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
