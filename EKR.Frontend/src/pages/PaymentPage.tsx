import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useFormatMoney } from '../hooks/useFormatMoney';
import { useT } from '../hooks/useT';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectSession } from '../store/slices/authSlice';
import { selectCartItems, selectCartTotalPrice } from '../store/slices/cartSlice';
import { placeOrder } from '../store/slices/ordersSlice';
import type { CheckoutForm } from '../types';
import { downloadInvoice } from '../utils/invoice';
import type { PaymentType } from '../constants/payment';
import { calcDepositAmount } from '../constants/payment';

export function PaymentPage() {
  const items = useAppSelector(selectCartItems);
  const session = useAppSelector(selectSession);
  const dispatch = useAppDispatch();
  const t = useT();
  const [paymentType, setPaymentType] = useState<PaymentType>('deposit');
  const [acceptedDepositPolicy, setAcceptedDepositPolicy] = useState(false);
  const totalPrice = useAppSelector(selectCartTotalPrice);
  const depositAmount = calcDepositAmount(totalPrice);
  const payNow = paymentType === 'full' ? totalPrice : depositAmount;
  const balanceDue = paymentType === 'full' ? 0 : totalPrice - depositAmount;
  const format = useFormatMoney();
  const navigate = useNavigate();
  const [method, setMethod] = useState('Bank transfer (demo)');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const raw = sessionStorage.getItem('zeir-checkout');
  if (!session) return <Navigate to="/login" replace />;
  if (!raw || items.length === 0) return <Navigate to="/cart" replace />;

  const customer = JSON.parse(raw) as CheckoutForm;

  async function onPay(e: FormEvent) {
    e.preventDefault();
    if (!acceptedDepositPolicy) return;
    setProcessing(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 400));
      const order = await dispatch(
        placeOrder({ customer, paymentMethod: method, paymentType })
      ).unwrap();
      await downloadInvoice(order);
      sessionStorage.removeItem('zeir-checkout');
      navigate(`/order-success/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order failed');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="page container" style={{ maxWidth: 560 }}>
      <div className="section-head">
        <div>
          <h2>{t('pay_title')}</h2>
          <p>{t('pay_sub')}</p>
        </div>
      </div>

      <div className="alert deposit-warn" role="alert">
        <strong>{t('deposit_warn_title')}</strong>
        <p style={{ margin: '0.5rem 0 0' }}>{t('deposit_warn_body')}</p>
      </div>

      <form onSubmit={onPay} className="card-surface" style={{ padding: '1.5rem', marginTop: '1rem' }}>
        {error && <div className="alert" style={{ marginBottom: '1rem' }}>{error}</div>}
        <div className="alert-ok alert" style={{ marginBottom: '1rem' }}>
          {t('inv_total_order')}: <strong>{format(totalPrice)}</strong>
        </div>

        <fieldset className="paymentType">
          <legend>{t('pay_type')}</legend>
          <label>
            <input
              type="radio"
              name="paymentType"
              value="deposit"
              checked={paymentType === 'deposit'}
              onChange={() => setPaymentType('deposit')}
            />
            {t('pay_deposit')} — {format(depositAmount)} ({t('pay_left')} {format(balanceDue)})
          </label>
          <label>
            <input
              type="radio"
              name="paymentType"
              value="full"
              checked={paymentType === 'full'}
              onChange={() => setPaymentType('full')}
            />
            {t('pay_full')} — {format(totalPrice)}
          </label>
          <p>
            {t('pay_now')}: <strong>{format(payNow)}</strong>
          </p>
        </fieldset>

        <label className="deposit-ack">
          <input
            type="checkbox"
            checked={acceptedDepositPolicy}
            onChange={(e) => setAcceptedDepositPolicy(e.target.checked)}
            required
          />
          <span>{t('deposit_ack')}</span>
        </label>

        <div className="field" style={{ marginTop: '1rem' }}>
          <label>{t('pay_method')}</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option>Bank transfer (demo)</option>
            <option>Card Visa / MC (demo)</option>
            <option>Alipay (demo)</option>
          </select>
        </div>

        <div className="field" style={{ marginTop: '0.9rem' }}>
          <label>{t('pay_card')}</label>
          <input placeholder="ACCT-000003" disabled={processing} />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            marginTop: '0.9rem',
          }}
        >
          <div className="field">
            <label>{t('pay_expiry')}</label>
            <input placeholder="MM/YY" disabled={processing} />
          </div>
          <div className="field">
            <label>CVC</label>
            <input placeholder="123" disabled={processing} />
          </div>
        </div>

        <p className="muted" style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
          {customer.firstName} {customer.lastName} · {customer.city}
        </p>

        <button
          className="btn btn-accent"
          style={{ marginTop: '1.25rem', width: '100%' }}
          disabled={processing || !acceptedDepositPolicy}
        >
          {processing ? t('pay_processing') : t('pay_submit')}
        </button>
      </form>
    </div>
  );
}
