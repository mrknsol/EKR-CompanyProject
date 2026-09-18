import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectOrders } from '../store/slices/ordersSlice';
import { setPermissionAsked } from '../store/slices/notificationSlice';
import { useFormatMoney } from '../hooks/useFormatMoney';
import { useT } from '../hooks/useT';
import { downloadInvoice } from '../utils/invoice';
import {
  getNotificationPermission,
  requestNotificationPermission,
  showBrowserNotification,
} from '../components/browserNotify';

export function OrderSuccessPage() {
  const { id } = useParams();
  const order = useAppSelector((s) => selectOrders(s).find((o) => o.id === id));
  const format = useFormatMoney();
  const t = useT();
  const dispatch = useAppDispatch();
  const [permission, setPermission] = useState(getNotificationPermission());
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  async function enableNotifications() {
    setAsking(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      dispatch(setPermissionAsked(true));
      if (result === 'granted') {
        await showBrowserNotification('ZEIR', t('notif_enabled'));
      }
    } finally {
      setAsking(false);
    }
  }

  async function testNotification() {
    await showBrowserNotification('ZEIR', t('notif_test'));
  }

  if (!order) {
    return (
      <div className="page container">
        <p>Заказ не найден.</p>
        <Link to="/catalog">В каталог</Link>
      </div>
    );
  }

  return (
    <div className="page container" style={{ maxWidth: 640 }}>
      <div className="card-surface" style={{ padding: '2rem' }}>
        <p className="badge">Оплачено (демо)</p>
        <h2 style={{ marginTop: '0.75rem' }}>Заказ {order.id.slice(0, 8)}… принят</h2>
        <p className="muted" style={{ marginTop: '0.5rem' }}>
          Накладная сформирована для вас и для склада EKR. При необходимости скачайте
          ещё раз.
        </p>

        <div style={{ marginTop: '1.25rem' }}>
          <p>
            <strong>
              {order.customer.firstName} {order.customer.lastName}
            </strong>
          </p>
          <p className="muted">
            {order.customer.deliveryRegion} · {order.customer.city}, {order.customer.address}
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            {t('inv_total_pieces')}: {order.totalPieces} {t('inv_pcs')} · {format(order.totalPrice)}
          </p>
          <p className="muted" style={{ marginTop: '0.35rem' }}>
            {t('inv_amount_paid')}: {format(order.amountPaid ?? order.totalPrice)}
            {(order.balanceDue ?? 0) > 0 &&
              ` · ${t('inv_balance_due')}: ${format(order.balanceDue ?? 0)}`}
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void downloadInvoice(order)}
          >
            {t('inv_download')}
          </button>
          <Link to="/catalog" className="btn btn-ghost">
            Продолжить выбор
          </Link>
        </div>
      </div>

      {permission === 'default' && (
        <div
          className="card-surface notif-permission"
          style={{ padding: '1.25rem', marginTop: '1rem' }}
        >
          <strong>{t('notif_after_order_title')}</strong>
          <p style={{ margin: '0.5rem 0 0.85rem' }}>{t('notif_after_order_body')}</p>
          <button
            type="button"
            className="btn btn-accent"
            disabled={asking}
            onClick={() => void enableNotifications()}
          >
            {asking ? '…' : t('notif_enable')}
          </button>
        </div>
      )}

      {permission === 'granted' && (
        <div
          className="card-surface"
          style={{ padding: '1.25rem', marginTop: '1rem' }}
        >
          <p style={{ margin: '0 0 0.75rem' }}>{t('notif_enabled')}</p>
          <p className="muted" style={{ margin: '0 0 0.85rem', fontSize: '0.9rem' }}>
            {t('notif_os_hint')}
          </p>
          <button type="button" className="btn btn-primary" onClick={() => void testNotification()}>
            {t('notif_test')}
          </button>
        </div>
      )}

      {permission === 'denied' && (
        <p className="muted" style={{ marginTop: '1rem' }}>
          {t('notif_denied')}
        </p>
      )}
    </div>
  );
}
