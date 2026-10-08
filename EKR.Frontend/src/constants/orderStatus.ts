import type { OrderStatus } from '../types';

/** Linear progress steps (cancelled is separate). */
export const ORDER_PROGRESS_STEPS: OrderStatus[] = [
  'accepted',
  'in_production',
  'ready',
  'paid',
  'in_transit',
  'delivered',
];

/** Statuses an admin can pick in the dropdown. */
export const ADMIN_ORDER_STATUSES: OrderStatus[] = [
  ...ORDER_PROGRESS_STEPS,
  'cancelled',
];

export function isOrderEditable(status: OrderStatus): boolean {
  return (
    status !== 'cancelled' &&
    status !== 'in_transit' &&
    status !== 'delivered'
  );
}

export function progressIndex(status: OrderStatus): number {
  if (status === 'cancelled') return -1;
  const idx = ORDER_PROGRESS_STEPS.indexOf(status);
  return idx >= 0 ? idx : 0;
}

/** Normalize legacy API/DB values to current statuses. */
export function normalizeOrderStatus(raw: string | undefined | null): OrderStatus {
  const s = (raw ?? 'accepted').trim().toLowerCase();
  switch (s) {
    case 'accepted':
    case 'pending':
      return 'accepted';
    case 'in_production':
    case 'inproduction':
    case 'confirmed':
      return 'in_production';
    case 'ready':
      return 'ready';
    case 'paid':
      return 'paid';
    case 'in_transit':
    case 'intransit':
    case 'shipped':
      return 'in_transit';
    case 'delivered':
      return 'delivered';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    default:
      return 'accepted';
  }
}
