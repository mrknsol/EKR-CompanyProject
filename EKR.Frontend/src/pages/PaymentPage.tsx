import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  broadcastNotification,
  buildAdminPaymentNotification,
} from '../components/browserNotify';
import { useFormatMoney } from '../hooks/useFormatMoney';
import { useT } from '../hooks/useT';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectSession } from '../store/slices/authSlice';
import { selectCartItems, selectCartTotalPrice } from '../store/slices/cartSlice';
import { selectLang } from '../store/slices/localeSlice';
import {
  fetchMyOrders,
  payOrderBalance,
  placeOrder,
  selectOrderById,
  selectOrdersLoading,
} from '../store/slices/ordersSlice';
import type { CheckoutForm } from '../types';
import { downloadInvoice } from '../utils/invoice';
import type { PaymentType } from '../constants/payment';
import { calcDepositAmount } from '../constants/payment';
import {
  formatCardNumber,
  formatExpiry,
  onlyDigits,
  validateCardFields,
} from '../utils/cardPayment';

export function PaymentPage() {
  const [searchParams] = useSearchParams();
  const balanceOrderId = searchParams.get('orderId');
  const isBalancePay = Boolean(balanceOrderId);

  const items = useAppSelector(selectCartItems);
  const session = useAppSelector(selectSession);
  const balanceOrder = useAppSelector(selectOrderById(balanceOrderId ?? ''));
  const ordersLoading = useAppSelector(selectOrdersLoading);
  const dispatch = useAppDispatch();
  const lang = useAppSelector(selectLang);
  const t = useT();
  const format = useFormatMoney();
  const navigate = useNavigate();

  const [paymentType, setPaymentType] = useState<PaymentType>('deposit');
  const [acceptedDepositPolicy, setAcceptedDepositPolicy] = useState(false);
  const [method, setMethod] = useState('Card Visa / MC (demo)');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const totalPrice = useAppSelector(selectCartTotalPrice);
  const depositAmount = calcDepositAmount(totalPrice);
  const checkoutPayNow = paymentType === 'full' ? totalPrice : depositAmount;
  const checkoutBalanceDue = paymentType === 'full' ? 0 : totalPrice - depositAmount;

  const raw = sessionStorage.getItem('zeir-checkout');

  useEffect(() => {
    if (isBalancePay && session?.token) {
      void dispatch(fetchMyOrders());
    }
  }, [dispatch, isBalancePay, session?.token]);

  if (!session) return <Navigate to="/login" replace />;

  if (!isBalancePay) {
    if (!raw || items.length === 0) return <Navigate to="/cart" replace />;
  }

  if (isBalancePay) {
    if (!balanceOrder && ordersLoading) {
      return (
        <div className="page container" style={{ maxWidth: 560 }}>
          <p className="muted">{t('order_loading')}</p>
        </div>
      );
    }
    if (!balanceOrder) {
      return (
        <div className="page container" style={{ maxWidth: 560 }}>
          <p>{t('order_not_found')}</p>
          <Link to="/profile">{t('order_back_profile')}</Link>
        </div>
      );
    }
    if (balanceOrder.status !== 'ready' || (balanceOrder.balanceDue ?? 0) <= 0) {
      return <Navigate to={`/orders/${balanceOrder.id}`} replace />;
    }
  }

  const customer = !isBalancePay
    ? (JSON.parse(raw!) as CheckoutForm)
    : balanceOrder!.customer;

  const payNow = isBalancePay ? balanceOrder!.balanceDue : checkoutPayNow;

  function cardErrorMessage(code: ReturnType<typeof validateCardFields>) {
    if (code === 'name') return t('order_pay_err_name');
    if (code === 'card') return t('order_pay_err_card');
    if (code === 'expiry') return t('order_pay_err_expiry');
    if (code === 'cvc') return t('order_pay_err_cvc');
    return null;
  }

  async function onPay(e: FormEvent) {
    e.preventDefault();
    if (!isBalancePay && !acceptedDepositPolicy) return;

    const invalid = validateCardFields({ cardName, cardNumber, expiry, cvc });
    if (invalid) {
      setError(cardErrorMessage(invalid));
      return;
    }

    setProcessing(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 700));

      if (isBalancePay && balanceOrderId) {
        const updated = await dispatch(payOrderBalance(balanceOrderId)).unwrap();
        const customerName =
          `${updated.customer.firstName} ${updated.customer.lastName}`.trim() ||
          updated.customer.email;
        broadcastNotification(
          buildAdminPaymentNotification({
            orderId: updated.id,
            customerName,
            userEmail: updated.customer.email,
            lang,
          })
        );
        await downloadInvoice(updated);
        navigate(`/orders/${updated.id}`);
        return;
      }

      const order = await dispatch(
        placeOrder({ customer, paymentMethod: method, paymentType })
      ).unwrap();
      await downloadInvoice(order);
      sessionStorage.removeItem('zeir-checkout');
      navigate(`/order-success/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('order_pay_fail'));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="page container" style={{ maxWidth: 560 }}>
      <div className="section-head">
        <div>
          <h2>{isBalancePay ? t('order_pay_balance_title') : t('pay_title')}</h2>
          <p>{isBalancePay ? t('order_pay_balance_body') : t('pay_sub')}</p>
        </div>
      </div>

      {!isBalancePay && (
        <div className="alert deposit-warn" role="alert">
          <strong>{t('deposit_warn_title')}</strong>
          <p style={{ margin: '0.5rem 0 0' }}>{t('deposit_warn_body')}</p>
        </div>
      )}

      <form onSubmit={(e) => void onPay(e)} className="card-surface" style={{ padding: '1.5rem', marginTop: '1rem' }}>
        {error && <div className="alert" style={{ marginBottom: '1rem' }}>{error}</div>}

        {isBalancePay ? (
          <div className="alert alert-ok" style={{ marginBottom: '1rem' }}>
            {t('order_pay_field_label')}: <strong>{format(payNow)}</strong>
            <div className="muted" style={{ marginTop: '0.35rem' }}>
              {t('inv_total_order')}: {format(balanceOrder!.totalPrice)} ·{' '}
              {t('inv_amount_paid')}: {format(balanceOrder!.amountPaid)}
            </div>
          </div>
        ) : (
          <>
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
                {t('pay_deposit')} — {format(depositAmount)} ({t('pay_left')}{' '}
                {format(checkoutBalanceDue)})
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
                {t('pay_now')}: <strong>{format(checkoutPayNow)}</strong>
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
          </>
        )}

        <div className="field" style={{ marginTop: '1rem' }}>
          <label>{t('pay_method')}</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} disabled={processing}>
            <option>Card Visa / MC (demo)</option>
            <option>Bank transfer (demo)</option>
            <option>Alipay (demo)</option>
          </select>
        </div>

        <div className="field" style={{ marginTop: '0.9rem' }}>
          <label>{t('order_pay_card_name')}</label>
          <input
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="IVAN IVANOV"
            autoComplete="cc-name"
            disabled={processing}
            required
          />
        </div>

        <div className="field" style={{ marginTop: '0.9rem' }}>
          <label>{t('order_pay_card_number')}</label>
          <input
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="ACCT-000003"
            inputMode="numeric"
            autoComplete="cc-number"
            disabled={processing}
            required
          />
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
            <input
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/YY"
              inputMode="numeric"
              autoComplete="cc-exp"
              disabled={processing}
              required
            />
          </div>
          <div className="field">
            <label>CVC</label>
            <input
              value={cvc}
              onChange={(e) => setCvc(onlyDigits(e.target.value).slice(0, 4))}
              placeholder="123"
              inputMode="numeric"
              autoComplete="cc-csc"
              disabled={processing}
              required
            />
          </div>
        </div>

        <p className="muted" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
          {t('order_pay_demo_note')}
        </p>

        <p className="muted" style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
          {customer.firstName} {customer.lastName}
          {customer.city ? ` · ${customer.city}` : ''}
        </p>

        <button
          className="btn btn-accent"
          style={{ marginTop: '1.25rem', width: '100%' }}
          disabled={processing || (!isBalancePay && !acceptedDepositPolicy)}
        >
          {processing
            ? t('pay_processing')
            : `${t('pay_submit')} · ${format(payNow)}`}
        </button>

        {isBalancePay && (
          <Link
            to={`/orders/${balanceOrderId}`}
            className="btn btn-ghost"
            style={{ marginTop: '0.75rem', width: '100%', textAlign: 'center' }}
          >
            {t('order_edit_close')}
          </Link>
        )}
      </form>
    </div>
  );
}
