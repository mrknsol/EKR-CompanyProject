# How order status notifications work (ZEIR)

This file explains **how we built** notifications so that:

1. the site asks for notification permission after an order;
2. a message appears in the bell icon;
3. a system notification pops up on the laptop (Chrome/macOS);
4. it still works when admin and user are in **different browsers**.

---

## High-level flow

```text
Admin changes status → Save → API (PostgreSQL)
                              ↓
User (tab open) polls API every ~8 seconds
                              ↓
Status changed? → Redux (bell) + Service Worker (OS notification)
```

Earlier we tried `BroadcastChannel` — that only works **between tabs of the same browser**.  
After orders moved to the database, admin in Chrome A and user in Chrome B **cannot** hear each other via BroadcastChannel. So we added **API polling**.

---

## Which files do what

| File | Role |
|------|------|
| `public/sw-notifications.js` | Service Worker — shows the OS system notification |
| `src/components/browserNotify.ts` | Permission, show notification, status map, copy |
| `src/hooks/useOrderStatusWatcher.ts` | Polls orders and detects status changes |
| `src/components/NotificationBell.tsx` | Header bell UI |
| `src/pages/OrderSuccessPage.tsx` | Asks for permission after payment |
| `src/pages/AdminOrdersPage.tsx` | Status select + **Save** button |
| `src/store/slices/changeOrderStatus.ts` | Saves status via API |
| `src/main.tsx` | Registers SW + starts the watcher |

---

## 1. Service Worker — Chrome/laptop system notification

File: `EKR.Frontend/public/sw-notifications.js`

Browsers do not always show `new Notification(...)`, especially when the tab is in the background.  
More reliable path: **Service Worker** → `registration.showNotification(...)`.

```js
/* Install SW immediately; don't wait for old tabs to close */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

/* Take control of open pages for this origin */
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
```

Clicking the notification focuses/opens the site:

```js
self.addEventListener('notificationclick', (event) => {
  event.notification.close();                    // dismiss the toast
  const orderId = event.notification.data?.orderId;
  const url = orderId ? '/profile' : '/';       // where to send the user

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          return client.focus();                 // tab already open → focus it
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);     // otherwise open a new one
      }
    })
  );
});
```

Show a notification when the page posts a message:

```js
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'show-notification') return;

  event.waitUntil(
    self.registration.showNotification(data.title || 'ZEIR', {
      body: data.body || '',
      icon: '/favicon.svg',
      tag: data.tag || 'zeir',
      requireInteraction: true,   // stays until user interacts
      data: { orderId: data.orderId || null },
    })
  );
});
```

---

## 2. `browserNotify.ts` — permission and display

File: `EKR.Frontend/src/components/browserNotify.ts`

### Register the Service Worker

```ts
export async function ensureNotificationServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;

  // Register once (file in /public is served as /sw-notifications.js)
  return navigator.serviceWorker.register('/sw-notifications.js');
}
```

### Ask the user for permission

```ts
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';

  // Already allowed
  if (Notification.permission === 'granted') {
    await ensureNotificationServiceWorker();
    return 'granted';
  }

  // User previously clicked “Block”
  if (Notification.permission === 'denied') return 'denied';

  // Browser shows the system Allow / Block dialog
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    await ensureNotificationServiceWorker();
  }
  return result;
}
```

Important: call `requestPermission()` from a **user click** (button). Otherwise Chrome may silently refuse.

### Show a system notification

```ts
export async function showBrowserNotification(title, body, orderId?) {
  if (Notification.permission !== 'granted') return; // no permission → exit

  const reg = await ensureNotificationServiceWorker();
  const ready = reg ? await navigator.serviceWorker.ready : null;

  if (ready) {
    // Preferred path: via SW → visible on the laptop
    await ready.showNotification(title, {
      body,
      icon: '/favicon.svg',
      tag: orderId ? `zeir-order-${orderId}` : `zeir-${Date.now()}`,
      requireInteraction: true,
      data: { orderId: orderId ?? null },
    });
    return;
  }

  // Fallback if SW is unavailable
  new Notification(title, { body, icon: '/favicon.svg', requireInteraction: true });
}
```

### Status map (avoid spam on every poll)

```ts
const STATUS_MAP_KEY = 'zeir-order-status-map';

// Last status we already “saw” per orderId
export function readStatusMap() { /* localStorage get */ }
export function writeStatusMap(map) { /* localStorage set */ }
```

Rule: notify **only if** the status changed compared to the previous value in `localStorage`.

---

## 3. After checkout — ask for permission

File: `EKR.Frontend/src/pages/OrderSuccessPage.tsx`

After payment and PDF download, the user sees:

```tsx
<button onClick={() => void enableNotifications()}>
  Allow notifications
</button>
```

```ts
async function enableNotifications() {
  const result = await requestNotificationPermission(); // Chrome dialog
  dispatch(setPermissionAsked(true));
  if (result === 'granted') {
    // Immediate test toast on the laptop
    await showBrowserNotification('ZEIR', t('notif_enabled'));
  }
}
```

If already granted — **“Test laptop notification”** button:

```ts
async function testNotification() {
  await showBrowserNotification('ZEIR', t('notif_test'));
}
```

---

## 4. Admin: Select + Save button

File: `EKR.Frontend/src/pages/AdminOrdersPage.tsx`

Previously the status was sent to the API as soon as `<select>` changed — easy to mis-click.  
Now:

```tsx
const [draftStatus, setDraftStatus] = useState<Record<string, OrderStatus>>({});

<select
  value={draft}                                 // draft only, not in DB yet
  onChange={(e) => setDraftStatus(...)}          // local state only
/>

<button
  disabled={!dirty}                              // enabled only if status actually changed
  onClick={() => void onSaveStatus(o.id)}        // then write to API
>
  Save
</button>
```

```ts
async function onSaveStatus(orderId: string) {
  await dispatch(changeOrderStatus({ id: orderId, status })).unwrap();
}
```

---

## 5. Persisting status via API

File: `EKR.Frontend/src/store/slices/changeOrderStatus.ts`

```ts
export const changeOrderStatus = createAsyncThunk(
  'orders/changeStatus',
  async ({ id, status }, { getState, dispatch }) => {
    // 1) Write new status to the server (PostgreSQL)
    const updated = await dispatch(changeOrderStatusRemote({ id, status })).unwrap();

    // 2) Build notification object (localized text)
    const notification = buildStatusNotification({ ... });

    // 3) Broadcast — only for other tabs of THE SAME browser (bonus)
    broadcastNotification(notification);

    // 4) If admin happens to be the order owner — show immediately
    //    Normally the customer learns via polling (next section)
    ...
  }
);
```

Backend endpoint: `PUT /api/Order/{id}/status`.

---

## 6. Why it works across browsers — polling

File: `EKR.Frontend/src/hooks/useOrderStatusWatcher.ts`

This is the main “near real-time” mechanism without WebSockets.

### Every 8 seconds, fetch the user’s orders

```ts
useEffect(() => {
  if (!session?.token || isAdmin) return;

  const tick = () => {
    void dispatch(fetchMyOrders()); // GET /api/Order/mine
  };

  const id = window.setInterval(tick, 8000);
  window.addEventListener('focus', tick); // also refresh when tab gains focus

  return () => {
    clearInterval(id);
    window.removeEventListener('focus', tick);
  };
}, [...]);
```

### Compare with the previous status

```ts
useEffect(() => {
  const map = readStatusMap(); // what we remembered before

  for (const order of orders) {
    const prev = map[order.id];

    // Different from before → admin changed the status
    if (prev && prev !== order.status) {
      const notification = buildStatusNotification({ ... });

      dispatch(addNotification(notification));           // in-app bell
      showBrowserNotification(notification.title, ...); // laptop OS toast
    }

    map[order.id] = order.status; // remember the new value
  }

  writeStatusMap(map);
}, [orders, ...]);
```

The watcher is wired in `main.tsx`:

```tsx
function AppBootstrap({ children }) {
  useOrderStatusWatcher();                 // watch statuses
  useEffect(() => {
    void ensureNotificationServiceWorker(); // register SW on startup
  }, []);
  ...
}
```

---

## 7. In-app bell

File: `EKR.Frontend/src/components/NotificationBell.tsx`

```tsx
const items = useAppSelector(selectMyNotifications(userId, email));
const unread = useAppSelector(selectUnreadCount(userId, email));
```

- Red badge — unread count  
- List — notifications from Redux (`notificationSlice`, persisted in `localStorage`)  
- Test button — calls `showBrowserNotification` again  

---

## Happy path (how to test)

1. User signs in → places an order → PDF downloads.  
2. On the success page, click **Allow notifications** → allow in Chrome.  
3. Click **Test laptop notification** — a system toast should appear.  
4. In another browser, admin opens orders → changes status → **Save**.  
5. Within ~8 seconds the user gets:
   - a badge on the bell;
   - a Chrome system notification (if the site tab is still open).

---

## Limitations (honest)

| Situation | Works? |
|----------|--------|
| Site tab open (even in background) | Yes |
| Chrome fully quit | No (needs Web Push + VAPID on the server) |
| Different browsers / devices | Yes, via API polling |
| BroadcastChannel alone | No across different browsers |

If the OS toast still does not appear, check:

**macOS → System Settings → Notifications → Google Chrome → Allow**  
and turn off **Focus / Do Not Disturb**.

---

## One-line summary

**Admin writes the status to the DB → the user periodically reads orders from the API → on a status diff we show both the in-app bell and a system notification via the Service Worker.**
