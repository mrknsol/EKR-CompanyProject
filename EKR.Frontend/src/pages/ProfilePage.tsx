import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { CountrySelect, PhoneField, LocaleCurrencyBar } from '../components/LocaleControls';
import { OrderEditPanel } from '../components/OrderEditPanel';
import { OrderPayPanel } from '../components/OrderPayPanel';
import { OrderProgress } from '../components/OrderProgress';
import { statusLabel } from '../components/browserNotify';
import { isOrderEditable } from '../constants/orderStatus';
import { countryByCode, countryLabel } from '../data/countries';
import { LANGS } from '../data/localeDict';
import { CURRENCIES } from '../constants/currency';
import type { CurrencyCode } from '../constants/currency';
import type { Lang } from '../data/localeDict';
import { useFormatMoney } from '../hooks/useFormatMoney';
import { useT } from '../hooks/useT';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logoutAsync, saveProfile, selectSession } from '../store/slices/authSlice';
import { selectCurrency, setCurrency } from '../store/slices/currencySlice';
import { selectLang, setLang } from '../store/slices/localeSlice';
import { selectOrders } from '../store/slices/ordersSlice';
import { downloadInvoice } from '../utils/invoice';
import './profile.css';

export function ProfilePage() {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectSession);
  const orders = useAppSelector(selectOrders);
  const t = useT();
  const lang = useAppSelector(selectLang);
  const currency = useAppSelector(selectCurrency);
  const format = useFormatMoney();
  const navigate = useNavigate();
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  const user = session?.user;
  const dial = countryByCode(user?.countryCode || 'CN')?.dial ?? '+86';
  const initialNational = (user?.phoneNumber ?? '').replace(dial, '').trim();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [company, setCompany] = useState(user?.company ?? '');
  const [countryCode, setCountryCode] = useState(user?.countryCode || 'CN');
  const [nationalPhone, setNationalPhone] = useState(initialNational);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session || !user) {
    return <Navigate to="/login" replace />;
  }

  const myOrders = orders.filter(
    (o) => o.userId === user.id || o.customer.email === user.email
  );

  function onPhoneCountry(code: string) {
    setCountryCode(code);
  }

  async function onLogout() {
    await dispatch(logoutAsync());
    navigate('/login', { replace: true });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    const c = countryByCode(countryCode)!;
    const phoneNumber = `${c.dial} ${nationalPhone}`.trim();
    const country = countryLabel(countryCode, lang);
    try {
      await dispatch(
        saveProfile({
          firstName,
          lastName,
          company,
          countryCode,
          country,
          phoneNumber,
        })
      ).unwrap();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Failed to save profile');
    }
  }

  return (
    <div className="page container profile-page">
      <div className="section-head">
        <div>
          <h2>{t('profile_title')}</h2>
          <p>{t('profile_sub')}</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => void onLogout()}>
          {t('nav_logout')}
        </button>
      </div>

      <div className="profile-grid">
        <form className="card-surface profile-card" onSubmit={(e) => void onSubmit(e)}>
          <h3>{t('nav_profile')}</h3>
          <div className="field">
            <label>{t('first_name')}</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div className="field">
            <label>{t('last_name')}</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input value={user.email} disabled />
          </div>
          <div className="field">
            <label>{t('company')}</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <PhoneField
            countryCode={countryCode}
            nationalNumber={nationalPhone}
            onCountryChange={onPhoneCountry}
            onNumberChange={setNationalPhone}
            lang={lang}
            label={t('phone')}
            hint={t('phone_auto_country')}
          />
          <CountrySelect
            value={countryCode}
            onChange={setCountryCode}
            lang={lang}
            label={t('country')}
          />
          {saved && <div className="alert alert-ok">OK</div>}
          {error && <div className="alert">{error}</div>}
          <button className="btn btn-primary" type="submit">
            {t('profile_save')}
          </button>
        </form>

        <div className="profile-side">
          <div className="card-surface profile-card">
            <h3>{t('profile_prefs')}</h3>
            <LocaleCurrencyBar
              lang={lang}
              currency={currency}
              onLang={(l) => dispatch(setLang(l as Lang))}
              onCurrency={(c) => dispatch(setCurrency(c as CurrencyCode))}
              langLabel={t('language')}
              currencyLabel={t('currency')}
              langs={LANGS}
              currencies={CURRENCIES}
            />
            <p className="muted" style={{ marginTop: '0.85rem', fontSize: '0.9rem' }}>
              {t('language')}: {lang.toUpperCase()} · {t('currency')}: {currency}
            </p>
          </div>

          <div className="card-surface profile-card">
            <h3>{t('profile_orders')}</h3>
            {myOrders.length === 0 ? (
              <p className="muted">
                {t('no_orders')}{' '}
                <Link to="/catalog" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  {t('to_catalog')}
                </Link>
              </p>
            ) : (
              <div className="profile-orders">
                {myOrders.map((o) => {
                  const version = o.currentVersion ?? 1;
                  const isEditing = editingOrderId === o.id;
                  const canEdit = isOrderEditable(o.status);
                  return (
                    <div key={o.id} className="profile-order-block">
                      <div className="profile-order-row">
                        <div>
                          <strong>{o.id.slice(0, 8)}…</strong>
                          <div className="muted">
                            {new Date(o.createdAt).toLocaleString()} ·{' '}
                            {t('order_version', { n: version })} ·{' '}
                            {statusLabel(o.status, lang)}
                          </div>
                        </div>
                        <div>
                          {o.totalPieces} {t('pcs')} · {format(o.totalPrice)}
                        </div>
                        <div className="profile-order-actions">
                          <Link to={`/orders/${o.id}`} className="btn btn-primary">
                            {t('order_track')}
                          </Link>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => void downloadInvoice(o, { version: 1 })}
                          >
                            {t('order_pdf_original')}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => void downloadInvoice(o)}
                          >
                            {version > 1 ? t('order_pdf_current') : t('inv_download')}
                          </button>
                          {canEdit && (
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() =>
                                setEditingOrderId(isEditing ? null : o.id)
                              }
                            >
                              {t('order_edit')}
                            </button>
                          )}
                        </div>
                      </div>
                      <OrderProgress status={o.status} lang={lang} compact />
                      <OrderPayPanel order={o} compact />
                      {isEditing && (
                        <OrderEditPanel
                          order={o}
                          onClose={() => setEditingOrderId(null)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
