import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { ScrollReveal } from '../ScrollReveal';
import { useFormatMoney } from '../../hooks/useFormatMoney';
import { useT } from '../../hooks/useT';
import './product-card.css';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const format = useFormatMoney();
  const t = useT();
  const cover = product.colors[0]?.imageUrls?.[0] ?? product.imageUrls[0];
  const delay = ((index % 8) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

  return (
    <ScrollReveal delay={delay}>
      <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-card-media">
        <img src={cover} alt={product.name} loading="lazy" />
        <div className="product-card-tags">
          <span className="badge">{product.modelType}</span>
          {!product.isInStock && <span className="badge badge-warn">{t('out_stock')}</span>}
        </div>
      </div>
      <div className="product-card-body">
        <div className="product-code">{product.code}</div>
        <h3>{product.name}</h3>
        <p className="muted">
          {t('series_of')} {product.piecesPerSeries} {t('pcs')} · {t('min_abbr')}{' '}
          {product.minQuantity} {t('pcs')}
        </p>
        <div className="product-card-meta">
          <strong>{format(product.wholesalePrice)}</strong>
          <span className="muted">{t('wholesale_each')}</span>
        </div>
        <div className="swatches">
          {product.colors.slice(0, 5).map((c) => (
            <span key={c.code} title={`${c.name} (${c.code})`} style={{ background: c.hex }} />
          ))}
        </div>
      </div>
    </Link>
    </ScrollReveal>
  );
}
