import type { OrderStatus } from '../types';

export interface AppNotification {
  id: string;
  orderId: string;
  userId?: string;
  userEmail: string;
  status: OrderStatus;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

const CHANNEL = 'zeir-order-notifications';
const STATUS_MAP_KEY = 'zeir-order-status-map';
const SW_PATH = '/sw-notifications.js';

let swReady: Promise<ServiceWorkerRegistration | null> | null = null;

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function ensureNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  swReady ??= navigator.serviceWorker
    .register(SW_PATH)
    .then((reg) => reg)
    .catch((err) => {
      console.warn('SW registration failed', err);
      return null;
    });
  return swReady;
}

export async function requestNotificationPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') {
    await ensureNotificationServiceWorker();
    return 'granted';
  }
  if (Notification.permission === 'denied') return 'denied';

  const result = await Notification.requestPermission();
  if (result === 'granted') {
    await ensureNotificationServiceWorker();
  }
  return result;
}

/** Show a system (Chrome/macOS) notification via Service Worker when possible. */
export async function showBrowserNotification(
  title: string,
  body: string,
  orderId?: string
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const tag = orderId ? `zeir-order-${orderId}` : `zeir-${Date.now()}`;

  try {
    const reg = await ensureNotificationServiceWorker();
    const ready = reg ? await navigator.serviceWorker.ready : null;

    if (ready) {
      // Preferred: OS notification through SW (works better when tab is backgrounded)
      await ready.showNotification(title, {
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag,
        requireInteraction: true,
        data: { orderId: orderId ?? null },
      });
      return;
    }
  } catch (err) {
    console.warn('SW notification failed, falling back', err);
  }

  try {
    const n = new Notification(title, {
      body,
      icon: '/favicon.svg',
      tag,
      requireInteraction: true,
    });
    n.onclick = () => {
      window.focus();
      n.close();
      if (orderId) window.location.href = '/profile';
    };
  } catch (err) {
    console.error('Failed to show browser notification', err);
  }
}

export function broadcastNotification(notification: AppNotification) {
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage({ type: 'order-status', notification });
    channel.close();
  } catch {
    /* unsupported */
  }
}

export function subscribeNotifications(
  onMessage: (notification: AppNotification) => void
): () => void {
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (event: MessageEvent) => {
      if (event.data?.type === 'order-status' && event.data.notification) {
        onMessage(event.data.notification as AppNotification);
      }
    };
    return () => channel.close();
  } catch {
    return () => undefined;
  }
}

export function readStatusMap(): Record<string, OrderStatus> {
  try {
    const raw = localStorage.getItem(STATUS_MAP_KEY);
    return raw ? (JSON.parse(raw) as Record<string, OrderStatus>) : {};
  } catch {
    return {};
  }
}

export function writeStatusMap(map: Record<string, OrderStatus>) {
  localStorage.setItem(STATUS_MAP_KEY, JSON.stringify(map));
}

export function statusLabel(status: OrderStatus, lang: string): string {
  const map: Record<OrderStatus, Record<string, string>> = {
    pending: { ru: 'ожидает оплаты', en: 'pending payment', zh: '待付款', az: 'gözləyir' },
    paid: { ru: 'оплачен', en: 'paid', zh: '已付款', az: 'ödənilib' },
    confirmed: { ru: 'подтверждён', en: 'confirmed', zh: '已确认', az: 'təsdiqlənib' },
    shipped: { ru: 'отправлен', en: 'shipped', zh: '已发货', az: 'göndərilib' },
    cancelled: { ru: 'отменён', en: 'cancelled', zh: '已取消', az: 'ləğv edilib' },
  };
  return map[status]?.[lang] ?? map[status]?.en ?? status;
}

export function buildStatusNotification(params: {
  orderId: string;
  userId?: string;
  userEmail: string;
  status: OrderStatus;
  lang: string;
}): AppNotification {
  const label = statusLabel(params.status, params.lang);
  const shortId = params.orderId.slice(0, 8);
  return {
    id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    orderId: params.orderId,
    userId: params.userId,
    userEmail: params.userEmail,
    status: params.status,
    title: 'ZEIR',
    body:
      params.lang === 'ru'
        ? `Статус заказа ${shortId}…: ${label}`
        : params.lang === 'zh'
          ? `订单 ${shortId}… 状态：${label}`
          : params.lang === 'az'
            ? `Sifariş ${shortId}… statusu: ${label}`
            : `Order ${shortId}… status: ${label}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
}
