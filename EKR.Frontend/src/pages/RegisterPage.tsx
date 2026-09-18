import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CountrySelect, PhoneField } from '../components/LocaleControls';
import { countryByCode, countryLabel } from '../data/countries';
import { useT } from '../hooks/useT';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { register, selectAuthLoading } from '../store/slices/authSlice';
import { selectLang } from '../store/slices/localeSlice';
import './auth.css';

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectAuthLoading);
  const navigate = useNavigate();
  const t = useT();
  const lang = useAppSelector(selectLang);
  const [error, setError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState('CN');
  const [nationalPhone, setNationalPhone] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onPhoneCountry(code: string) {
    setCountryCode(code);
  }

  function onCountrySelect(code: string) {
    setCountryCode(code);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError(t('passwords_mismatch'));
      return;
    }
    const c = countryByCode(countryCode)!;
    const phoneNumber = `${c.dial} ${nationalPhone}`.trim();
    const country = countryLabel(countryCode, lang);
    try {
      await dispatch(
        register({
          ...form,
          phoneNumber,
          country,
          countryCode,
        })
      ).unwrap();
      navigate('/profile');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel card-surface wide">
        <p className="auth-brand">ZEIR</p>
        <h1>{t('reg_title')}</h1>
        <p className="muted">{t('reg_sub')}</p>
        {error && <div className="alert">{error}</div>}

        <form onSubmit={onSubmit} className="auth-form grid-2">
          <div className="field">
            <label>{t('first_name')}</label>
            <input required value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
          </div>
          <div className="field">
            <label>{t('last_name')}</label>
            <input required value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
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
            onChange={onCountrySelect}
            lang={lang}
            label={t('country')}
          />

          <div className="field">
            <label>{t('password')}</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
            />
          </div>
          <div className="field">
            <label>{t('confirm_password')}</label>
            <input
              type="password"
              required
              value={form.confirmPassword}
              onChange={(e) => set('confirmPassword', e.target.value)}
            />
          </div>
          <button className="btn btn-primary span-2" type="submit" disabled={loading}>
            {loading ? t('creating') : t('register_link')}
          </button>
        </form>

        <p className="muted auth-foot">
          {t('have_account')} <Link to="/login">{t('nav_login')}</Link>
        </p>
      </div>
    </div>
  );
}
