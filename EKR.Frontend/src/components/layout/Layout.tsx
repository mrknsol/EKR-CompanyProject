import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, ShoppingBag, UserRound, X } from 'lucide-react';
import { NotificationBell } from '../NotificationBell';
import { PageTransition } from '../PageTransition';
import { LocaleCurrencyBar } from '../LocaleControls';
import { COMPANY } from '../../data/countries';
import { CURRENCIES } from '../../constants/currency';
import { LANGS } from '../../data/localeDict';
import { useT } from '../../hooks/useT';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutAsync, selectIsAdmin, selectSession } from '../../store/slices/authSlice';
import { selectCartItems } from '../../store/slices/cartSlice';
import { selectCurrency, setCurrency } from '../../store/slices/currencySlice';
import { selectLang, setLang } from '../../store/slices/localeSlice';
import type { CurrencyCode } from '../../constants/currency';
import type { Lang } from '../../data/localeDict';
import './layout.css';

export function Layout() {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectSession);
  const isAdmin = useAppSelector(selectIsAdmin);
  const items = useAppSelector(selectCartItems);
  const navigate = useNavigate();
  const t = useT();
  const lang = useAppSelector(selectLang);
  const currency = useAppSelector(selectCurrency);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cartCount = items.length;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="shell">
      <div className="top-strip">
        <div className="container top-strip-inner">
          <span>{COMPANY.factory.label[lang]}</span>
          <span className="top-dot" />
          <span>{COMPANY.office.label[lang]}</span>
        </div>
      </div>

      <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="container header-row">
          <div className="header-left">
            <button
              type="button"
              className="icon-btn mobile-only"
              aria-label="Menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
              <span className="brand-mark">ZEIR</span>
              <span className="brand-sub">by EKR</span>
            </Link>
          </div>

          <nav className="nav desktop-nav">
            <NavLink to="/" end>
              {t('nav_home')}
            </NavLink>
            <NavLink to="/catalog">{t('nav_catalog')}</NavLink>
            <NavLink to="/about">{t('nav_about')}</NavLink>
            <NavLink to="/delivery">{t('nav_delivery')}</NavLink>
            <NavLink to="/register">{t('nav_partners')}</NavLink>
            {isAdmin && <NavLink to="/admin">{t('nav_admin')}</NavLink>}
          </nav>

          <div className="header-actions">
            <div className="locale-slot desktop-only">
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
            </div>

            <NotificationBell />

            <Link to="/cart" className="icon-btn" aria-label={t('nav_cart')}>
              <ShoppingBag size={18} />
              {cartCount > 0 && <span className="cart-dot">{cartCount}</span>}
            </Link>

            {session ? (
              <Link to="/profile" className="user-chip">
                <UserRound size={16} />
                <span className="user-chip-name">{session.user.firstName || 'Profile'}</span>
              </Link>
            ) : (
              <Link to="/login" className="btn btn-primary header-login">
                {t('nav_login')}
              </Link>
            )}
          </div>
        </div>

        {menuOpen && (
          <div className="mobile-drawer is-open">
            <nav className="mobile-nav">
              <NavLink to="/" end onClick={() => setMenuOpen(false)}>
                {t('nav_home')}
              </NavLink>
              <NavLink to="/catalog" onClick={() => setMenuOpen(false)}>
                {t('nav_catalog')}
              </NavLink>
              <NavLink to="/about" onClick={() => setMenuOpen(false)}>
                {t('nav_about')}
              </NavLink>
              <NavLink to="/delivery" onClick={() => setMenuOpen(false)}>
                {t('nav_delivery')}
              </NavLink>
              <NavLink to="/register" onClick={() => setMenuOpen(false)}>
                {t('nav_partners')}
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" onClick={() => setMenuOpen(false)}>
                  {t('nav_admin')}
                </NavLink>
              )}
              {session && (
                <NavLink to="/profile" onClick={() => setMenuOpen(false)}>
                  {t('nav_profile')}
                </NavLink>
              )}
            </nav>
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
            {session && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  void dispatch(logoutAsync()).then(() => {
                    setMenuOpen(false);
                    navigate('/');
                  });
                }}
              >
                {t('nav_logout')}
              </button>
            )}
          </div>
        )}
      </header>

      <main>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <div className="brand brand-footer">
              <span className="brand-mark">ZEIR</span>
              <span className="brand-sub">by EKR</span>
            </div>
            <p className="footer-text">{t('footer_tag')}</p>
            <div className="footer-badges">
              <span>Hebei Factory</span>
              <span>Guangzhou Office</span>
              <span>Wholesale B2B</span>
            </div>
          </div>

          <div>
            <h3>{t('footer_sections')}</h3>
            <Link to="/catalog">{t('nav_catalog')}</Link>
            <Link to="/delivery">{t('nav_delivery')}</Link>
            <Link to="/about">{t('nav_about')}</Link>
            <Link to="/register">{t('nav_partners')}</Link>
            <Link to="/profile">{t('nav_profile')}</Link>
          </div>

          <div>
            <h3>{t('footer_company')}</h3>
            <p className="footer-text">{COMPANY.factory.label[lang]}</p>
            <p className="footer-text">{COMPANY.office.label[lang]}</p>
            <p className="footer-text" style={{ marginTop: '0.75rem' }}>
              Brand ZEIR · Company EKR
            </p>
          </div>

          <div>
            <h3>{t('footer_contacts')}</h3>
            <p className="footer-text">{COMPANY.email}</p>
            <p className="footer-text">{COMPANY.phone}</p>
            <p className="footer-text">WeChat / WhatsApp on request</p>
            <div style={{ marginTop: '1rem' }}>
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
            </div>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>{t('footer_legal')}</span>
          <span>Made for wholesale partners</span>
        </div>
      </footer>
    </div>
  );
}
