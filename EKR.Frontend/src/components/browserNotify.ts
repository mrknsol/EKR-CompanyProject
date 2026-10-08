import type { OrderStatus } from '../types';

export type NotificationAudience = 'customer' | 'admin';

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
  audience?: NotificationAudience;
  kind?: 'status' | 'new_order' | 'payment';
}

const CHANNEL = 'zeir-order-notifications';
const STATUS_MAP_KEY = 'zeir-order-status-map';
const ADMIN_ORDERS_MAP_KEY = 'zeir-admin-orders-map';
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
      if (orderId) window.location.href = `/orders/${orderId}`;
      else window.location.href = '/profile';
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
    throw ("broadcastNotification Error")
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

export function readAdminOrdersMap(): Record<string, OrderStatus> {
  try {
    const raw = localStorage.getItem(ADMIN_ORDERS_MAP_KEY);
    return raw ? (JSON.parse(raw) as Record<string, OrderStatus>) : {};
  } catch {
    return {};
  }
}

export function writeAdminOrdersMap(map: Record<string, OrderStatus>) {
  localStorage.setItem(ADMIN_ORDERS_MAP_KEY, JSON.stringify(map));
}

export function statusLabel(status: OrderStatus, lang: string): string {
  const map: Record<OrderStatus, Record<string, string>> = {
    accepted: { ru: 'принят', en: 'accepted', zh: '已接单', az: 'qəbul edilib' },
    in_production: { ru: 'в пошиве', en: 'in production', zh: '缝制中', az: 'tikilir' },
    ready: { ru: 'готов', en: 'ready', zh: '已就绪', az: 'hazırdır' },
    paid: { ru: 'оплачен', en: 'paid', zh: '已付款', az: 'ödənilib' },
    in_transit: { ru: 'в пути', en: 'in transit', zh: '配送中', az: 'yoldadır' },
    delivered: { ru: 'доставлен', en: 'delivered', zh: '已送达', az: 'çatdırılıb' },
    cancelled: { ru: 'отменён', en: 'cancelled', zh: '已取消', az: 'ləğv edilib' },
  };
  return map[status]?.[lang] ?? map[status]?.en ?? status;
}

function ntfId() {
  return `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
  let body: string;
  if (params.status === 'ready') {
    body =
      params.lang === 'ru'
        ? `Заказ ${shortId}… готов. Оплатите остаток в личном кабинете.`
        : params.lang === 'zh'
          ? `订单 ${shortId}… 已就绪，请支付尾款。`
          : params.lang === 'az'
            ? `Sifariş ${shortId}… hazırdır. Qalan məbləği ödəyin.`
            : `Order ${shortId}… is ready. Please pay the remaining balance.`;
  } else if (params.status === 'delivered') {
    body =
      params.lang === 'ru'
        ? `Заказ ${shortId}… доставлен. Приятного ношения!`
        : params.lang === 'zh'
          ? `订单 ${shortId}… 已送达。`
          : params.lang === 'az'
            ? `Sifariş ${shortId}… çatdırılıb.`
            : `Order ${shortId}… has been delivered.`;
  } else {
    body =
      params.lang === 'ru'
        ? `Статус заказа ${shortId}…: ${label}`
        : params.lang === 'zh'
          ? `订单 ${shortId}… 状态：${label}`
          : params.lang === 'az'
            ? `Sifariş ${shortId}… statusu: ${label}`
            : `Order ${shortId}… status: ${label}`;
  }
  return {
    id: ntfId(),
    orderId: params.orderId,
    userId: params.userId,
    userEmail: params.userEmail,
    status: params.status,
    title: 'ZEIR',
    body,
    createdAt: new Date().toISOString(),
    read: false,
    audience: 'customer',
    kind: 'status',
  };
}

export function buildAdminNewOrderNotification(params: {
  orderId: string;
  customerName: string;
  userEmail: string;
  lang: string;
}): AppNotification {
  const shortId = params.orderId.slice(0, 8);
  const body =
    params.lang === 'ru'
      ? `Новый заказ ${shortId}… от ${params.customerName}`
      : params.lang === 'zh'
        ? `新订单 ${shortId}…，客户：${params.customerName}`
        : params.lang === 'az'
          ? `Yeni sifariş ${shortId}… — ${params.customerName}`
          : `New order ${shortId}… from ${params.customerName}`;

  return {
    id: ntfId(),
    orderId: params.orderId,
    userEmail: params.userEmail,
    status: 'accepted',
    title: 'ZEIR Admin',
    body,
    createdAt: new Date().toISOString(),
    read: false,
    audience: 'admin',
    kind: 'new_order',
  };
}

export function buildAdminPaymentNotification(params: {
  orderId: string;
  customerName: string;
  userEmail: string;
  lang: string;
}): AppNotification {
  const shortId = params.orderId.slice(0, 8);
  const body =
    params.lang === 'ru'
      ? `${params.customerName} оплатил заказ ${shortId}…`
      : params.lang === 'zh'
        ? `${params.customerName} 已支付订单 ${shortId}…`
        : params.lang === 'az'
          ? `${params.customerName} sifarişi ödədi ${shortId}…`
          : `${params.customerName} paid order ${shortId}…`;

  return {
    id: ntfId(),
    orderId: params.orderId,
    userEmail: params.userEmail,
    status: 'paid',
    title: 'ZEIR Admin',
    body,
    createdAt: new Date().toISOString(),
    read: false,
    audience: 'admin',
    kind: 'payment',
  };
}
