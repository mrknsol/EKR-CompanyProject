import { COMPANY } from '../data/countries';
import { DELIVERY_REGIONS } from '../data/mockProducts';
import { useT } from '../hooks/useT';
import { useAppSelector } from '../store/hooks';
import { selectLang } from '../store/slices/localeSlice';

export function DeliveryPage() {
  const t = useT();
  const lang = useAppSelector(selectLang);

  return (
    <div className="page container">
      <div className="section-head">
        <div>
          <h2>{t('delivery_title')}</h2>
          <p>
            {COMPANY.office.label[lang]} · {COMPANY.factory.label[lang]}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {DELIVERY_REGIONS.map((region) => (
          <article key={region.id} className="card-surface" style={{ padding: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <h3>{region.title}</h3>
              <span className="badge">{region.eta}</span>
            </div>
            <p className="muted" style={{ marginTop: '0.65rem' }}>
              {region.terms}
            </p>
            <p style={{ marginTop: '0.75rem' }}>
              <strong>Cities:</strong> {region.cities.join(', ')}
            </p>
          </article>
        ))}
      </div>

      <div className="card-surface" style={{ padding: '1.25rem', marginTop: '1.25rem' }}>
        <h3>Flow</h3>
        <ol style={{ margin: '0.75rem 0 0', paddingLeft: '1.2rem', color: 'var(--muted)' }}>
          <li>{t('how_sub')}</li>
          <li>{t('feat_series_t')}</li>
          <li>{t('feat_inv_t')}</li>
        </ol>
      </div>
    </div>
  );
}
