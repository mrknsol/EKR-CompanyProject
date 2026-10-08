import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { OrderPayPanel } from '../components/OrderPayPanel';
import { OrderProgress } from '../components/OrderProgress';
import { statusLabel } from '../components/browserNotify';
import { useFormatMoney } from '../hooks/useFormatMoney';
import { useT } from '../hooks/useT';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectSession } from '../store/slices/authSlice';
import { selectLang } from '../store/slices/localeSlice';
import {
  fetchMyOrders,
  selectOrderById,
  selectOrdersLoading,
} from '../store/slices/ordersSlice';
import { downloadInvoice } from '../utils/invoice';
import './orderDetail.css';

export function OrderDetailPage() {
  const { id } = useParams();
  const session = useAppSelector(selectSession);
  const lang = useAppSelector(selectLang);
  const loading = useAppSelector(selectOrdersLoading);
  const order = useAppSelector(selectOrderById(id ?? ''));
  const dispatch = useAppDispatch();
  const format = useFormatMoney();
  const t = useT();

  useEffect(() => {
    if (session?.token) void dispatch(fetchMyOrders());
  }, [dispatch, session?.token]);

  if (!session) return <Navigate to="/login" replace />;

  if (!order && loading) {
    return (
      <div className="page container">
        <p className="muted">{t('order_loading')}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page container">
        <p>{t('order_not_found')}</p>
        <Link to="/profile">{t('order_back_profile')}</Link>
      </div>
    );
  }

  return (
    <div className="page container order-detail-page">
      <div className="section-head">
        <div>
          <p className="muted">
            <Link to="/profile">{t('order_back_profile')}</Link>
          </p>
          <h2>
            {t('order_detail_title')} {order.id.slice(0, 8)}…
          </h2>
          <p>
            {t('order_current_status')}:{' '}
            <strong>{statusLabel(order.status, lang)}</strong>
          </p>
        </div>
      </div>

      <div className="card-surface order-detail-card">
        <h3>{t('order_progress_title')}</h3>
        <OrderProgress status={order.status} lang={lang} />
      </div>

      <OrderPayPanel order={order} />

      <div className="card-surface order-detail-card">
        <h3>{t('order_summary')}</h3>
        <p>
          {order.customer.firstName} {order.customer.lastName}
        </p>
        <p className="muted">
          {order.customer.deliveryRegion} · {order.customer.city},{' '}
          {order.customer.address}
        </p>
        <p style={{ marginTop: '0.75rem' }}>
          {order.totalPieces} {t('pcs')} · {format(order.totalPrice)}
        </p>
        <p className="muted">
          {t('inv_amount_paid')}: {format(order.amountPaid)}
          {(order.balanceDue ?? 0) > 0 &&
            ` · ${t('inv_balance_due')}: ${format(order.balanceDue)}`}
        </p>
        <div className="order-detail-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void downloadInvoice(order)}
          >
            {t('inv_download')}
          </button>
        </div>
      </div>
    </div>
  );
}
