import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { DELIVERY_REGIONS } from '../data/mockProducts';
import { useFormatMoney } from '../hooks/useFormatMoney';
import { useT } from '../hooks/useT';
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../store/slices/authSlice';
import {
  selectCartItems,
  selectCartTotalPieces,
  selectCartTotalPrice,
} from '../store/slices/cartSlice';
import type { CheckoutForm } from '../types';

export function CheckoutPage() {
  const items = useAppSelector(selectCartItems);
  const totalPieces = useAppSelector(selectCartTotalPieces);
  const totalPrice = useAppSelector(selectCartTotalPrice);
  const user = useAppSelector(selectUser);
  const format = useFormatMoney();
  const t = useT();
  const navigate = useNavigate();

  const [form, setForm] = useState<CheckoutForm>({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phoneNumber ?? '',
    email: user?.email ?? '',
    company: '',
    city: '',
    address: '',
    deliveryRegion: DELIVERY_REGIONS[0].title,
    notes: '',
  });

  if (items.length === 0) return <Navigate to="/cart" replace />;

  function set<K extends keyof CheckoutForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    sessionStorage.setItem('zeir-checkout', JSON.stringify(form));
    navigate('/payment');
  }

  return (
    <div className="page container">
      <div className="section-head">
        <div>
          <h2>Данные для доставки</h2>
          <p>Имя, фамилия и адрес обязательны — они попадут в накладную.</p>
        </div>
      </div>

      <div className="alert deposit-warn" role="alert" style={{ marginBottom: '1.25rem' }}>
        <strong>{t('deposit_warn_title')}</strong>
        <p style={{ margin: '0.5rem 0 0' }}>{t('deposit_warn_body')}</p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 0.8fr',
          gap: '1.25rem',
          alignItems: 'start',
        }}
        className="checkout-grid"
      >
        <form onSubmit={onSubmit} className="card-surface" style={{ padding: '1.25rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.9rem',
            }}
            className="form-grid"
          >
            <div className="field">
              <label>Имя</label>
              <input required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
            </div>
            <div className="field">
              <label>Фамилия</label>
              <input required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
            </div>
            <div className="field">
              <label>Телефон</label>
              <input required value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Компания</label>
              <input value={form.company} onChange={(e) => set('company', e.target.value)} />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Регион доставки</label>
              <select
                value={form.deliveryRegion}
                onChange={(e) => set('deliveryRegion', e.target.value)}
              >
                {DELIVERY_REGIONS.map((r) => (
                  <option key={r.id} value={r.title}>
                    {r.title} · {r.eta}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Город</label>
              <input required value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div className="field">
              <label>Адрес склада / доставки</label>
              <input required value={form.address} onChange={(e) => set('address', e.target.value)} />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Комментарий</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Link to="/cart" className="btn btn-ghost">
              Назад
            </Link>
            <button type="submit" className="btn btn-primary">
              Перейти к оплате
            </button>
          </div>
        </form>

        <aside className="card-surface" style={{ padding: '1.25rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Итого</h3>
          <p className="muted">{items.length} моделей</p>
          <p>
            Курток: <strong>{totalPieces}</strong>
          </p>
          <p style={{ fontSize: '1.35rem', marginTop: '0.5rem' }}>
            <strong>{format(totalPrice)}</strong>
          </p>
          <p className="muted" style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
            Подробности доставки — на странице{' '}
            <Link to="/delivery" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              Доставка
            </Link>
            .
          </p>
        </aside>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
          .form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
