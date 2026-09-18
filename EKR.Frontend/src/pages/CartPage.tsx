import { Link } from 'react-router-dom';
import { ArrowRight, Trash2 } from 'lucide-react';
import { cartItemPieces } from '../utils/cart';
import { useFormatMoney } from '../hooks/useFormatMoney';
import { useT } from '../hooks/useT';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { remove, selectCartItems, selectCartTotalPieces, selectCartTotalPrice } from '../store/slices/cartSlice';
import { selectAllProducts } from '../store/slices/productsSlice';
import './cart.css';

export function CartPage() {
  const items = useAppSelector(selectCartItems);
  const dispatch = useAppDispatch();
  const totalPieces = useAppSelector(selectCartTotalPieces);
  const totalPrice = useAppSelector(selectCartTotalPrice);
  const products = useAppSelector(selectAllProducts);
  const format = useFormatMoney();
  const t = useT();

  const invalid = items.filter((i) => cartItemPieces(i) < i.minQuantity);

  return (
    <div className="page container cart-page">
      <div className="section-head">
        <div>
          <h2>{t('nav_cart')}</h2>
          <p>{t('how_sub')}</p>
        </div>
        {items.length > 0 && (
          <Link to="/catalog" className="btn btn-ghost">
            {t('all_catalog')}
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="cart-empty card-surface">
          <h3>{t('empty_cart')}</h3>
          <p className="muted">{t('catalog_sub')}</p>
          <Link to="/catalog" className="btn btn-primary">
            {t('to_catalog')} <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {items.map((item) => {
              const pcs = cartItemPieces(item);
              const product = products.find((p) => p.id === item.productId);
              const cover =
                product?.colors.find((c) => c.code === item.colorLines[0]?.colorCode)?.imageUrls[0] ??
                product?.imageUrls[0];
              const ok = pcs >= item.minQuantity;

              return (
                <article key={item.productId} className={`cart-item card-surface ${ok ? '' : 'warn'}`}>
                  <div className="cart-item-media">
                    {cover ? <img src={cover} alt={item.productName} /> : <div className="cart-ph" />}
                  </div>
                  <div className="cart-item-body">
                    <div className="cart-item-top">
                      <div>
                        <div className="product-code">{item.productCode}</div>
                        <h3>{item.productName}</h3>
                        <p className="muted">
                          {t('series_of')} {item.piecesPerSeries} {t('pcs')} · {t('min_abbr')}{' '}
                          {item.minQuantity}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="icon-btn cart-remove"
                        aria-label="Remove"
                        onClick={() => dispatch(remove(item.productId))}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="cart-colors">
                      {item.colorLines.map((l) => {
                        const color = product?.colors.find((c) => c.code === l.colorCode);
                        return (
                          <div key={l.colorCode} className="cart-color-chip">
                            <span
                              className="swatch"
                              style={{ background: color?.hex ?? '#888' }}
                            />
                            <div>
                              <strong>
                                {l.colorName} <em>({l.colorCode})</em>
                              </strong>
                              <span>
                                {l.seriesCount} ser. → {l.seriesCount * item.piecesPerSeries}{' '}
                                {t('pcs')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="cart-item-foot">
                      <div>
                        <span className="muted">{pcs} {t('pcs')}</span>
                        {!ok && (
                          <span className="badge badge-warn">
                            {t('minimum')} {item.minQuantity}
                          </span>
                        )}
                      </div>
                      <div className="cart-item-price">
                        <span className="muted">{format(item.wholesalePrice)} / {t('pcs')}</span>
                        <strong>{format(pcs * item.wholesalePrice)}</strong>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="cart-summary card-surface">
            <h3>Summary</h3>
            <div className="cart-summary-row">
              <span className="muted">Models</span>
              <strong>{items.length}</strong>
            </div>
            <div className="cart-summary-row">
              <span className="muted">{t('pcs')}</span>
              <strong>{totalPieces}</strong>
            </div>
            <div className="cart-summary-total">
              <span>Total</span>
              <strong>{format(totalPrice)}</strong>
            </div>
            {invalid.length > 0 && (
              <div className="alert">MOQ not met for {invalid.length} model(s).</div>
            )}
            <Link
              to="/checkout"
              className="btn btn-primary cart-checkout"
              style={invalid.length ? { pointerEvents: 'none', opacity: 0.5 } : undefined}
            >
              Checkout <ArrowRight size={16} />
            </Link>
            <Link to="/catalog" className="btn btn-ghost cart-checkout">
              {t('all_catalog')}
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
