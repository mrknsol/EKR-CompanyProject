import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import './index.css';
import './styles/animations.css';
import App from './App.tsx';
import { persistor, store } from './store';
import { setAuthTokens } from './api/client';
import { fetchProducts } from './store/slices/productsSlice';
import { fetchMe, selectIsAdmin, selectSession } from './store/slices/authSlice';
import { fetchAllOrders, fetchMyOrders } from './store/slices/ordersSlice';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { useOrderStatusWatcher } from './hooks/useOrderStatusWatcher';
import { ensureNotificationServiceWorker } from './components/browserNotify';

function AppBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectSession);
  const isAdmin = useAppSelector(selectIsAdmin);

  useOrderStatusWatcher();

  useEffect(() => {
    void ensureNotificationServiceWorker();
  }, []);

  useEffect(() => {
    void dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    if (session?.token) {
      setAuthTokens(session.token, session.refreshToken);
      void dispatch(fetchMe());
      void dispatch(isAdmin ? fetchAllOrders() : fetchMyOrders());
    }
  }, [dispatch, session?.token, isAdmin]);

  return children;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppBootstrap>
          <App />
        </AppBootstrap>
      </PersistGate>
    </Provider>
  </StrictMode>
);
