import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import { storage } from './storage';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import currencyReducer from './slices/currencySlice';
import localeReducer from './slices/localeSlice';
import notificationsReducer from './slices/notificationSlice';
import ordersReducer from './slices/ordersSlice';
import productsReducer from './slices/productsSlice';
import usersReducer from './slices/usersSlice';

const authPersistConfig = { key: 'zeir-auth', storage };
const cartPersistConfig = { key: 'zeir-cart', storage };
const localePersistConfig = { key: 'zeir-locale', storage };
const currencyPersistConfig = { key: 'zeir-currency', storage, version: 2 };
const usersPersistConfig = { key: 'zeir-users', storage, version: 2 };
const notificationsPersistConfig = { key: 'zeir-notifications', storage };

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  cart: persistReducer(cartPersistConfig, cartReducer),
  orders: ordersReducer,
  locale: persistReducer(localePersistConfig, localeReducer),
  currency: persistReducer(currencyPersistConfig, currencyReducer),
  users: persistReducer(usersPersistConfig, usersReducer),
  notifications: persistReducer(notificationsPersistConfig, notificationsReducer),
  products: productsReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
