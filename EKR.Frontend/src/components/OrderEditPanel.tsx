import { useMemo, useState } from 'react';
import type { CartColorLine, Order, OrderItemSnapshot, Product } from '../types';
import { isOrderEditable } from '../constants/orderStatus';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { saveOrderEdits } from '../store/slices/ordersSlice';
import { selectAllProducts } from '../store/slices/productsSlice';
import { downloadInvoice } from '../utils/invoice';
import { useFormatMoney } from '../hooks/useFormatMoney';
import { useT } from '../hooks/useT';

interface Props {
  order: Order;
  onClose: () => void;
}

function cloneItems(items: OrderItemSnapshot[]): OrderItemSnapshot[] {
  return items.map((item) => ({
    productId: item.productId,
    productCode: item.productCode,
    productName: item.productName,
    wholesalePrice: item.wholesalePrice,
    piecesPerSeries: item.piecesPerSeries,
    sizes: [...(item.sizes ?? [])],
    colorLines: item.colorLines.map((c) => ({
      colorCode: c.colorCode,
      colorName: c.colorName,
      seriesCount: c.seriesCount,
    })),
    totalPieces: item.totalPieces,
    lineTotal: item.lineTotal,
  }));
}

export function OrderEditPanel({ order, onClose }: Props) {
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectAllProducts);
  const format = useFormatMoney();
  const t = useT();
  const [draft, setDraft] = useState(() => cloneItems(order.items));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  const canEdit = isOrderEditable(order.status);

  function setSeries(productId: string, colorCode: string, seriesCount: number) {
    setDraft((items) =>
      items.map((item) => {
        if (item.productId !== productId) return item;
        return {
          ...item,
          colorLines: item.colorLines.map((c) =>
            c.colorCode === colorCode
              ? { ...c, seriesCount: Math.max(0, seriesCount) }
              : c
          ),
        };
      })
    );
  }

  function renameColor(productId: string, colorCode: string, nextCode: string) {
    const product = productById.get(productId);
    const color = product?.colors.find((c) => c.code === nextCode);
    if (!color) return;
    setDraft((items) =>
      items.map((item) => {
        if (item.productId !== productId) return item;
        const exists = item.colorLines.some((c) => c.colorCode === nextCode);
        if (exists && nextCode !== colorCode) return item;
        return {
          ...item,
          colorLines: item.colorLines.map((c) =>
            c.colorCode === colorCode
              ? { ...c, colorCode: color.code, colorName: color.name }
              : c
          ),
        };
      })
    );
  }

  function addColor(productId: string, colorCode: string) {
    const product = productById.get(productId);
    const color = product?.colors.find((c) => c.code === colorCode);
    if (!color) return;
    setDraft((items) =>
      items.map((item) => {
        if (item.productId !== productId) return item;
        if (item.colorLines.some((c) => c.colorCode === colorCode)) return item;
        const line: CartColorLine = {
          colorCode: color.code,
          colorName: color.name,
          seriesCount: 1,
        };
        return { ...item, colorLines: [...item.colorLines, line] };
      })
    );
  }

  function toggleSize(productId: string, size: string) {
    setDraft((items) =>
      items.map((item) => {
        if (item.productId !== productId) return item;
        const sizes = item.sizes ?? [];
        const has = sizes.includes(size);
        return {
          ...item,
          sizes: has ? sizes.filter((s) => s !== size) : [...sizes, size],
        };
      })
    );
  }

  async function onSave() {
    if (!canEdit) return;
    setSaving(true);
    setError(null);
    try {
      await dispatch(saveOrderEdits({ id: order.id, items: draft })).unwrap();
      onClose();
    } catch {
      setError(t('order_edit_fail'));
    } finally {
      setSaving(false);
    }
  }

  async function onSaveAndPdf() {
    if (!canEdit) return;
    setSaving(true);
    setError(null);
    try {
      const fresh = await dispatch(saveOrderEdits({ id: order.id, items: draft })).unwrap();
      await downloadInvoice(fresh);
      onClose();
    } catch {
      setError(t('order_edit_fail'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="order-edit-panel">
      <div className="order-edit-head">
        <strong>
          {t('order_edit_title')} {order.id}
        </strong>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          {t('order_edit_close')}
        </button>
      </div>

      {!canEdit && <div className="alert">{t('order_edit_locked')}</div>}
      {error && <div className="alert">{error}</div>}

      {draft.map((item) => {
        const product = productById.get(item.productId);
        const availableColors = product?.colors ?? [];
        const unusedColors = availableColors.filter(
          (c) => !item.colorLines.some((l) => l.colorCode === c.code)
        );
        const sizeOptions = product?.sizes?.length
          ? product.sizes
          : (item.sizes ?? []);

        return (
          <div key={item.productId} className="order-edit-item">
            <div className="order-edit-item-title">
              <strong>{item.productCode}</strong> · {item.productName}
              <span className="muted"> · {format(item.wholesalePrice)}</span>
            </div>

            <div className="field">
              <label>{t('fact_sizes')}</label>
              <div className="size-chips">
                {sizeOptions.map((size) => {
                  const on = (item.sizes ?? []).includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      className={`chip ${on ? 'chip-on' : ''}`}
                      disabled={!canEdit}
                      onClick={() => toggleSize(item.productId, size)}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {item.colorLines.map((line) => (
              <div key={line.colorCode} className="order-edit-color-row">
                <select
                  disabled={!canEdit}
                  value={line.colorCode}
                  onChange={(e) =>
                    renameColor(item.productId, line.colorCode, e.target.value)
                  }
                >
                  {availableColors.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                  {!availableColors.some((c) => c.code === line.colorCode) && (
                    <option value={line.colorCode}>
                      {line.colorName} ({line.colorCode})
                    </option>
                  )}
                </select>
                <label className="series-field">
                  {t('inv_col_series')}
                  <input
                    type="number"
                    min={0}
                    disabled={!canEdit}
                    value={line.seriesCount}
                    onChange={(e) =>
                      setSeries(
                        item.productId,
                        line.colorCode,
                        Number(e.target.value) || 0
                      )
                    }
                  />
                </label>
              </div>
            ))}

            {canEdit && unusedColors.length > 0 && (
              <div className="field">
                <label>{t('order_add_color')}</label>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) addColor(item.productId, e.target.value);
                    e.target.value = '';
                  }}
                >
                  <option value="">{t('order_pick_color')}</option>
                  {unusedColors.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );
      })}

      {canEdit && (
        <div className="order-edit-actions">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={saving}
            onClick={() => void onSave()}
          >
            {t('order_edit_save')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={saving}
            onClick={() => void onSaveAndPdf()}
          >
            {saving ? '…' : t('order_edit_save_pdf')}
          </button>
        </div>
      )}
    </div>
  );
}
