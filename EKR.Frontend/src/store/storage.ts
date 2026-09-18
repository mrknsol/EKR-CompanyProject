import type { WebStorage } from 'redux-persist/es/types';

// Vite + redux-persist CJS interop can break the default export from
// 'redux-persist/lib/storage'. Use localStorage directly instead.
export const storage: WebStorage = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
};
