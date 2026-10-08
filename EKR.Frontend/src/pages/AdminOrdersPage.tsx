import { useEffect, useState } from 'react';
import { statusLabel } from '../components/browserNotify';
import { ADMIN_ORDER_STATUSES } from '../constants/orderStatus';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { changeOrderStatus } from '../store/slices/changeOrderStatus';
import { selectLang } from '../store/slices/localeSlice';
import { fetchAllOrders, selectOrders, selectOrdersLoading } from '../store/slices/ordersSlice';
import { useFormatMoney } from '../hooks/useFormatMoney';
import { useT } from '../hooks/useT';
import { downloadInvoice } from '../utils/invoice';
import type { OrderStatus } from '../types';
import './admin.css';

export function AdminOrdersPage() {
  const orders = useAppSelector(selectOrders);
  const loading = useAppSelector(selectOrdersLoading);
  const lang = useAppSelector(selectLang);
  const dispatch = useAppDispatch();
  const format = useFormatMoney();
  const t = useT();
  /** Only stores overrides while admin is editing; server status wins otherwise. */
  const [draftOverride, setDraftOverride] = useState<Record<string, OrderStatus>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(fetchAllOrders());
  }, [dispatch]);

  // Clear overrides that match the live server status (e.g. after user paid → paid)
  useEffect(() => {
    setDraftOverride((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const o of orders) {
        if (next[o.id] === o.status) {
          delete next[o.id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [orders]);

  async function onSaveStatus(orderId: string) {
    const status = draftOverride[orderId];
    const current = orders.find((o) => o.id === orderId)?.status;
    if (!status || status === current) return;
    setSavingId(orderId);
    try {
      await dispatch(changeOrderStatus({ id: orderId, status })).unwrap();
      setDraftOverride((s) => {
        const next = { ...s };
        delete next[orderId];
        return next;
      });
      setSavedId(orderId);
      setTimeout(() => setSavedId((id) => (id === orderId ? null : id)), 2000);
    } finally {
      setSavingId(null);
    }
  }

  if (loading && orders.length === 0) {
    return <p className="muted">Loading orders…</p>;
  }

  if (orders.length === 0) {
    return (
      <p className="muted">
        Заказов пока нет — пользователь должен оформить заказ будучи залогиненным.
      </p>
    );
  }

  return (
    <div className="card-surface admin-orders">
      <table className="table admin-orders-table">
        <thead>
          <tr>
            <th>Заказ</th>
            <th>Клиент</th>
            <th>Доставка</th>
            <th>Итого</th>
            <th>Статус</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const draft = draftOverride[o.id] ?? o.status;
            const dirty = draft !== o.status;
            return (
              <tr key={o.id} className={dirty ? 'admin-order-row-dirty' : undefined}>
                <td>
                  <strong>{o.id.slice(0, 8)}…</strong>
                  <div className="muted">{new Date(o.createdAt).toLocaleString('ru-RU')}</div>
                </td>
                <td>
                  {o.customer.firstName} {o.customer.lastName}
                  <div className="muted">{o.customer.email}</div>
                </td>
                <td>
                  {o.customer.deliveryRegion}
                  <div className="muted">
                    {o.customer.city}, {o.customer.address}
                  </div>
                </td>
                <td>
                  {o.totalPieces} шт
                  <div>{format(o.totalPrice)}</div>
                  {(o.balanceDue ?? 0) > 0 && (
                    <div className="muted">остаток: {format(o.balanceDue)}</div>
                  )}
                </td>
                <td>
                  <div className="admin-status-cell">
                    <span className={`admin-status-badge status-${o.status}`}>
                      {statusLabel(o.status, lang)}
                    </span>
                    <div className="admin-status-controls">
                      <label className="admin-status-select-wrap">
                        <span className="sr-only">{t('admin_status_label')}</span>
                        <select
                          className="admin-status-select"
                          value={draft}
                          onChange={(e) =>
                            setDraftOverride((s) => ({
                              ...s,
                              [o.id]: e.target.value as OrderStatus,
                            }))
                          }
                        >
                          {ADMIN_ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {statusLabel(s, lang)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        className={`btn admin-status-save${dirty ? ' btn-primary' : ' btn-ghost'}`}
                        disabled={!dirty || savingId === o.id}
                        onClick={() => void onSaveStatus(o.id)}
                      >
                        {savingId === o.id
                          ? '…'
                          : savedId === o.id
                            ? t('admin_status_saved')
                            : t('admin_status_save')}
                      </button>
                    </div>
                  </div>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => void downloadInvoice(o)}
                  >
                    {t('inv_download')}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
