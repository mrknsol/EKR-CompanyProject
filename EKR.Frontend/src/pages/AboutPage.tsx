import { ScrollReveal } from '../components/ScrollReveal';
import { COMPANY } from '../data/countries';
import { useT } from '../hooks/useT';
import { useAppSelector } from '../store/hooks';
import { selectLang } from '../store/slices/localeSlice';
import './about.css';

export function AboutPage() {
  const t = useT();
  const lang = useAppSelector(selectLang);

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container">
          <p className="hero-eyebrow hero-stagger" style={{ animationDelay: '0.1s' }}>EKR · ZEIR</p>
          <h1 className="hero-stagger" style={{ animationDelay: '0.22s' }}>{t('about_title')}</h1>
          <p className="about-lead hero-stagger" style={{ animationDelay: '0.38s' }}>{t('about_lead')}</p>
        </div>
      </section>

      <section className="page container about-grid">
        <ScrollReveal as="article" className="card-surface about-card" variant="reveal-left" delay={1}>
          <span className="badge">Hebei</span>
          <h2>{COMPANY.factory.label[lang]}</h2>
          <p className="muted">{t('about_factory')}</p>
        </ScrollReveal>
        <ScrollReveal as="article" className="card-surface about-card" variant="reveal-right" delay={2}>
          <span className="badge">Guangzhou</span>
          <h2>{COMPANY.office.label[lang]}</h2>
          <p className="muted">{t('about_office')}</p>
        </ScrollReveal>
      </section>

      <section className="page container">
        <div className="about-stats">
          <ScrollReveal delay={1} className="about-stat">
            <strong>B2B</strong>
            <span className="muted">Wholesale only</span>
          </ScrollReveal>
          <ScrollReveal delay={2} className="about-stat">
            <strong>MOQ</strong>
            <span className="muted">Series-based</span>
          </ScrollReveal>
          <ScrollReveal delay={3} className="about-stat">
            <strong>Color codes</strong>
            <span className="muted">L1 · W2 · V1…</span>
          </ScrollReveal>
          <ScrollReveal delay={4} className="about-stat">
            <strong>Invoice</strong>
            <span className="muted">Excel packing list</span>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
