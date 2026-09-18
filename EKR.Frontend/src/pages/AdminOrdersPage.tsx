import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { changeOrderStatus } from '../store/slices/changeOrderStatus';
import { fetchAllOrders, selectOrders, selectOrdersLoading } from '../store/slices/ordersSlice';
import { useFormatMoney } from '../hooks/useFormatMoney';
import { useT } from '../hooks/useT';
import { downloadInvoice } from '../utils/invoice';
import type { OrderStatus } from '../types';

export function AdminOrdersPage() {
  const orders = useAppSelector(selectOrders);
  const loading = useAppSelector(selectOrdersLoading);
  const dispatch = useAppDispatch();
  const format = useFormatMoney();
  const t = useT();
  const [draftStatus, setDraftStatus] = useState<Record<string, OrderStatus>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(fetchAllOrders());
  }, [dispatch]);

  useEffect(() => {
    setDraftStatus((prev) => {
      const next = { ...prev };
      for (const o of orders) {
        if (next[o.id] === undefined) next[o.id] = o.status;
      }
      return next;
    });
  }, [orders]);

  async function onSaveStatus(orderId: string) {
    const status = draftStatus[orderId];
    const current = orders.find((o) => o.id === orderId)?.status;
    if (!status || status === current) return;
    setSavingId(orderId);
    try {
      await dispatch(changeOrderStatus({ id: orderId, status })).unwrap();
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
    <div className="card-surface" style={{ overflowX: 'auto' }}>
      <table className="table">
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
            const draft = draftStatus[o.id] ?? o.status;
            const dirty = draft !== o.status;
            return (
              <tr key={o.id}>
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
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <select
                      value={draft}
                      onChange={(e) =>
                        setDraftStatus((s) => ({
                          ...s,
                          [o.id]: e.target.value as OrderStatus,
                        }))
                      }
                    >
                      <option value="pending">pending</option>
                      <option value="paid">paid</option>
                      <option value="confirmed">confirmed</option>
                      <option value="shipped">shipped</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                    <button
                      type="button"
                      className="btn btn-primary"
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
