import { Link } from 'react-router-dom';
import { useFormatMoney } from '../hooks/useFormatMoney';
import { useT } from '../hooks/useT';
import type { Order } from '../types';
import './orderPayPanel.css';

interface Props {
  order: Order;
  compact?: boolean;
}

export function OrderPayPanel({ order, compact = false }: Props) {
  const format = useFormatMoney();
  const t = useT();

  const balance = order.balanceDue ?? 0;
  const alreadyPaid =
    order.status === 'paid' ||
    order.status === 'in_transit' ||
    order.status === 'delivered';
  const cancelled = order.status === 'cancelled';

  if (cancelled || balance <= 0 || alreadyPaid) {
    return null;
  }

  const canPay = order.status === 'ready';

  return (
    <div
      className={`order-pay-panel${compact ? ' order-pay-panel--compact' : ''}${
        canPay ? ' is-open' : ' is-locked'
      }`}
    >
      <div className="order-pay-panel-head">
        <strong>{t('order_pay_balance_title')}</strong>
        <span className="order-pay-amount">{format(balance)}</span>
      </div>

      {canPay ? (
        <p className="muted order-pay-hint">{t('order_pay_balance_body')}</p>
      ) : (
        <p className="order-pay-locked">{t('order_pay_locked')}</p>
      )}

      {canPay ? (
        <Link
          to={`/payment?orderId=${order.id}`}
          className="btn btn-primary"
          style={{ alignSelf: 'flex-start' }}
        >
          {t('order_pay_go_checkout')}
        </Link>
      ) : (
        <button type="button" className="btn btn-primary" disabled title={t('order_pay_locked')}>
          {t('order_pay_go_checkout')}
        </button>
      )}
    </div>
  );
}
