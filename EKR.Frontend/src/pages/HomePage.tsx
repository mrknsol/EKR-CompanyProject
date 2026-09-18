import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Factory, Layers3, PackageCheck } from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';
import { ScrollReveal } from '../components/ScrollReveal';
import { COMPANY } from '../data/countries';
import { useT } from '../hooks/useT';
import { useAppSelector } from '../store/hooks';
import { selectLang } from '../store/slices/localeSlice';
import { selectAllProducts } from '../store/slices/productsSlice';
import './home.css';

const HERO_SLIDES = [
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1539533018447-88d595369954?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1487225418761-4c2d42d1fd4c?auto=format&fit=crop&w=1800&q=80',
];

export function HomePage() {
  const products = useAppSelector(selectAllProducts).slice(0, 3);
  const t = useT();
  const lang = useAppSelector(selectLang);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-slides" aria-hidden>
          {HERO_SLIDES.map((src, i) => (
            <div
              key={src}
              className={`hero-slide ${i === slide ? 'is-active' : ''}`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
        </div>
        <div className="hero-overlay" />
        <div className="container hero-content">
          <p className="hero-eyebrow hero-stagger" style={{ animationDelay: '0.1s' }}>{t('hero_eyebrow')}</p>
          <h1 className="hero-brand hero-stagger" style={{ animationDelay: '0.2s' }}>Z'EIR</h1>
          <p className="hero-lead hero-stagger" style={{ animationDelay: '0.35s' }}>{t('hero_lead')}</p>
          <div className="hero-cta hero-stagger" style={{ animationDelay: '0.5s' }}>
            <Link to="/catalog" className="btn btn-accent">
              {t('hero_cta')} <ArrowRight size={18} />
            </Link>
            <Link to="/register" className="btn btn-ghost-light">
              {t('hero_partner')}
            </Link>
          </div>
          <div className="hero-dots hero-stagger" style={{ animationDelay: '0.65s' }}>
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                className={i === slide ? 'active' : ''}
                aria-label={`Slide ${i + 1}`}
                onClick={() => setSlide(i)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="home-strip">
        <div className="home-strip-track">
          <div className="home-strip-inner">
            <span>{COMPANY.factory.label[lang]}</span>
            <span>{COMPANY.office.label[lang]}</span>
            <span>MOQ · series · color codes</span>
            <span>{COMPANY.factory.label[lang]}</span>
            <span>{COMPANY.office.label[lang]}</span>
            <span>MOQ · series · color codes</span>
          </div>
        </div>
      </section>

      <section className="page container">
        <ScrollReveal className="section-head">
          <div>
            <h2>{t('how_title')}</h2>
            <p>{t('how_sub')}</p>
          </div>
        </ScrollReveal>
        <div className="feature-row">
          <ScrollReveal as="article" delay={1}>
            <Factory size={22} className="feature-icon" />
            <h3>{t('feat_prod')}</h3>
            <p className="muted">{t('feat_prod_t')}</p>
          </ScrollReveal>
          <ScrollReveal as="article" delay={2}>
            <Layers3 size={22} className="feature-icon" />
            <h3>{t('feat_series')}</h3>
            <p className="muted">{t('feat_series_t')}</p>
          </ScrollReveal>
          <ScrollReveal as="article" delay={3}>
            <PackageCheck size={22} className="feature-icon" />
            <h3>{t('feat_inv')}</h3>
            <p className="muted">{t('feat_inv_t')}</p>
          </ScrollReveal>
        </div>
      </section>

      <section className="page container featured">
        <ScrollReveal className="section-head">
          <div>
            <h2>{t('new_models')}</h2>
            <p>{t('catalog_sub')}</p>
          </div>
          <Link to="/catalog" className="btn btn-ghost">
            {t('all_catalog')}
          </Link>
        </ScrollReveal>
        <div className="grid-products">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
