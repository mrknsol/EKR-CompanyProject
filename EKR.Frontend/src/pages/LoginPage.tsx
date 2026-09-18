import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useT } from '../hooks/useT';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login, selectAuthLoading } from '../store/slices/authSlice';
import './auth.css';

export function LoginPage() {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectAuthLoading);
  const navigate = useNavigate();
  const t = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await dispatch(login({ email: email.trim(), password })).unwrap();
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel card-surface">
        <p className="auth-brand">ZEIR</p>
        <h1>{t('login_title')}</h1>
        <p className="muted">{t('login_sub')}</p>
        {error && <div className="alert">{error}</div>}
        <form onSubmit={onSubmit} className="auth-form">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">{t('password')}</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? t('signing_in') : t('nav_login')}
          </button>
        </form>
        <p className="muted auth-foot">
          {t('no_account')} <Link to="/register">{t('register_link')}</Link>
        </p>
        <p className="demo-hint">
          Admin: <code>admin@zeir.cn</code> / <code>Admin123!</code>
        </p>
      </div>
    </div>
  );
}
