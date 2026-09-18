import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useFormatMoney } from '../hooks/useFormatMoney';
import { useT } from '../hooks/useT';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addOrUpdate } from '../store/slices/cartSlice';
import { selectProductById } from '../store/slices/productsSlice';
import type { CartColorLine } from '../types';
import './product-detail.css';

export function ProductDetailPage() {
  const { id } = useParams();
  const product = useAppSelector(selectProductById(id ?? ''));
  const dispatch = useAppDispatch();
  const format = useFormatMoney();
  const t = useT();
  const navigate = useNavigate();

  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [seriesByColor, setSeriesByColor] = useState<Record<string, number>>({});

  const selectedColor = useMemo(() => {
    if (!product) return null;
    return product.colors.find((c) => c.code === (activeColor ?? product.colors[0]?.code)) ?? null;
  }, [product, activeColor]);

  const gallery = selectedColor?.imageUrls?.length
    ? selectedColor.imageUrls
    : product?.imageUrls ?? [];

  const colorLines: CartColorLine[] = useMemo(() => {
    if (!product) return [];
    return product.colors.map((c) => ({
      colorCode: c.code,
      colorName: c.name,
      seriesCount: seriesByColor[c.code] ?? 0,
    }));
  }, [product, seriesByColor]);

  const totalPieces = useMemo(() => {
    if (!product) return 0;
    return colorLines.reduce((s, l) => s + l.seriesCount * product.piecesPerSeries, 0);
  }, [colorLines, product]);

  if (!product) {
    return (
      <div className="page container">
        <p>{t('product_not_found')}</p>
        <Link to="/catalog">{t('to_catalog')}</Link>
      </div>
    );
  }

  const meetsMin = totalPieces >= product.minQuantity;
  const sizeLabel = product.sizeSystem === 'letter' ? t('size_letter') : t('size_num');

  function pickColor(code: string) {
    setActiveColor(code);
    setActiveImage(0);
  }

  function setSeries(code: string, value: number) {
    setSeriesByColor((prev) => ({ ...prev, [code]: Math.max(0, value) }));
  }

  function addToCart() {
    if (!product) return;
    dispatch(addOrUpdate({ product, colorLines }));
    navigate('/cart');
  }

  return (
    <div className="page container product-detail">
      <div className="pd-gallery">
        <img
          src={gallery[activeImage] ?? gallery[0]}
          alt={`${product.name} ${selectedColor?.name ?? ''}`}
          className="pd-main"
        />
        <div className="pd-thumbs">
          {gallery.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              className={`pd-thumb ${i === activeImage ? 'active' : ''}`}
              onClick={() => setActiveImage(i)}
            >
              <img src={url} alt="" />
            </button>
          ))}
        </div>

        <section className="pd-block color-preview">
          <h2>{t('colors_view')}</h2>
          <div className="color-swatch-grid">
            {product.colors.map((c) => (
              <button
                key={c.code}
                type="button"
                className={`color-preview-btn ${selectedColor?.code === c.code ? 'active' : ''}`}
                onClick={() => pickColor(c.code)}
              >
                <span className="swatch lg" style={{ background: c.hex }} />
                <span>
                  <strong>{c.name}</strong>
                  <em>{c.code}</em>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="pd-info">
        <p className="product-code">{product.code}</p>
        <h1>{product.name}</h1>
        <p className="muted">{product.description}</p>

        <div className="pd-price">
          <strong>{format(product.wholesalePrice)}</strong>
          <span className="muted">{t('wholesale_each')}</span>
        </div>

        <div className="pd-facts">
          <div>
            <span className="muted">{t('fact_type')}</span>
            <strong>{product.modelType}</strong>
          </div>
          <div>
            <span className="muted">{t('fact_season')}</span>
            <strong>{product.season}</strong>
          </div>
          <div>
            <span className="muted">{t('fact_series')}</span>
            <strong>
              {product.piecesPerSeries} {t('pcs')}
            </strong>
          </div>
          <div>
            <span className="muted">{t('fact_min')}</span>
            <strong>
              {product.minQuantity} {t('pcs')}
            </strong>
          </div>
          <div>
            <span className="muted">{t('fact_sizes')}</span>
            <strong>{sizeLabel}</strong>
          </div>
          <div>
            <span className="muted">{t('fact_grid')}</span>
            <strong>{product.sizes.join(', ')}</strong>
          </div>
        </div>

        <section className="pd-block">
          <h2>{t('materials')}</h2>
          <ul>
            <li>
              <strong>{t('material')}:</strong> {product.material}
            </li>
            <li>
              <strong>{t('lining')}:</strong> {product.lining}
            </li>
          </ul>
          <div className="feature-chips">
            {product.features.map((f) => (
              <span key={f} className="badge">
                {f}
              </span>
            ))}
          </div>
        </section>

        <section className="pd-block">
          <h2>{t('colors_order')}</h2>
          <p className="muted">{t('series_hint', { n: product.piecesPerSeries })}</p>
          <div className="color-order-list">
            {product.colors.map((c) => (
              <div
                key={c.code}
                className={`color-order-row ${selectedColor?.code === c.code ? 'focused' : ''}`}
              >
                <button type="button" className="swatch-btn" onClick={() => pickColor(c.code)}>
                  <span className="swatch" style={{ background: c.hex }} />
                </button>
                <div>
                  <strong>
                    {c.name} <span className="muted">({c.code})</span>
                  </strong>
                  <div className="muted">
                    {(seriesByColor[c.code] ?? 0) * product.piecesPerSeries} {t('pcs')}
                  </div>
                </div>
                <div className="qty">
                  <button type="button" onClick={() => setSeries(c.code, (seriesByColor[c.code] ?? 0) - 1)}>
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={seriesByColor[c.code] ?? 0}
                    onChange={(e) => setSeries(c.code, Number(e.target.value) || 0)}
                  />
                  <button type="button" onClick={() => setSeries(c.code, (seriesByColor[c.code] ?? 0) + 1)}>
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={`pd-total ${meetsMin ? 'ok' : ''}`}>
            <div>
              {t('selected')}: <strong>
                {totalPieces} {t('pcs')}
              </strong>{' '}
              · {format(totalPieces * product.wholesalePrice)}
            </div>
            {!meetsMin && (
              <div className="badge badge-warn">
                {t('minimum')} {product.minQuantity} {t('pcs')} ({t('now')} {totalPieces})
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn btn-primary"
            disabled={!meetsMin || !product.isInStock}
            onClick={addToCart}
          >
            {product.isInStock ? t('add_order') : t('out_stock')}
          </button>
        </section>
      </div>
    </div>
  );
}
