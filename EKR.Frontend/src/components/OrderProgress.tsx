import { statusLabel } from './browserNotify';
import {
  ORDER_PROGRESS_STEPS,
  progressIndex,
} from '../constants/orderStatus';
import type { OrderStatus } from '../types';
import './orderProgress.css';

interface OrderProgressProps {
  status: OrderStatus;
  lang: string;
  compact?: boolean;
}

export function OrderProgress({ status, lang, compact = false }: OrderProgressProps) {
  if (status === 'cancelled') {
    return (
      <div className={`order-progress order-progress--cancelled${compact ? ' order-progress--compact' : ''}`}>
        <span className="order-progress-cancelled">{statusLabel('cancelled', lang)}</span>
      </div>
    );
  }

  const current = progressIndex(status);
  const pct =
    ORDER_PROGRESS_STEPS.length <= 1
      ? 100
      : Math.round((current / (ORDER_PROGRESS_STEPS.length - 1)) * 100);

  return (
    <div className={`order-progress${compact ? ' order-progress--compact' : ''}`}>
      <div className="order-progress-track" aria-hidden>
        <div className="order-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <ol className="order-progress-steps">
        {ORDER_PROGRESS_STEPS.map((step, i) => {
          const done = i <= current;
          const active = i === current;
          return (
            <li
              key={step}
              className={`order-progress-step${done ? ' is-done' : ''}${active ? ' is-active' : ''}`}
            >
              <span className="order-progress-dot" />
              <span className="order-progress-label">{statusLabel(step, lang)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
