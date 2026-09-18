import { useMemo, useState } from 'react';
import { ProductCard } from '../components/product/ProductCard';
import { ScrollReveal } from '../components/ScrollReveal';
import { useT } from '../hooks/useT';
import { useAppSelector } from '../store/hooks';
import {
  selectAllProducts,
  selectProductsError,
  selectProductsLoading,
} from '../store/slices/productsSlice';

export function CatalogPage() {
  const products = useAppSelector(selectAllProducts);
  const loading = useAppSelector(selectProductsLoading);
  const error = useAppSelector(selectProductsError);
  const t = useT();
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');

  const types = useMemo(
    () => ['all', ...Array.from(new Set(products.map((p) => p.modelType)))],
    [products]
  );

  const filtered = products.filter((p) => {
    const matchType = type === 'all' || p.modelType === type;
    const matchQ =
      !q ||
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.code.toLowerCase().includes(q.toLowerCase());
    return matchType && matchQ;
  });

  return (
    <div className="page container">
      <ScrollReveal className="section-head">
        <div>
          <h2>{t('catalog_title')}</h2>
          <p>{t('catalog_sub')}</p>
        </div>
      </ScrollReveal>

      <ScrollReveal className="catalog-filters" delay={1}>
        <div className="field" style={{ minWidth: 220, flex: 1 }}>
          <label htmlFor="q">{t('search')}</label>
          <input id="q" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="field" style={{ minWidth: 180 }}>
          <label htmlFor="type">{t('type')}</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
            {types.map((tp) => (
              <option key={tp} value={tp}>
                {tp === 'all' ? t('all_models') : tp}
              </option>
            ))}
          </select>
        </div>
      </ScrollReveal>

      {loading && <p className="muted">Loading…</p>}
      {error && <div className="alert">{error}</div>}

      <div className="grid-products">
        {filtered.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i % 8} />
        ))}
      </div>
    </div>
  );
}
