import { Link, Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectIsAdmin } from '../store/slices/authSlice';
import './admin.css';

export function AdminLayout() {
  const isAdmin = useAppSelector(selectIsAdmin);

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="page container admin">
      <div className="section-head">
        <div>
          <h2>Админ ZEIR</h2>
          <p>Управление моделями, пользователями и заказами.</p>
        </div>
        <Link to="/" className="btn btn-ghost">
          На сайт
        </Link>
      </div>

      <nav className="admin-nav">
        <NavLink to="/admin" end>
          Обзор
        </NavLink>
        <NavLink to="/admin/products">Куртки</NavLink>
        <NavLink to="/admin/users">Пользователи</NavLink>
        <NavLink to="/admin/orders">Заказы</NavLink>
      </nav>

      <Outlet />
    </div>
  );
}

export function AdminDashboard() {
  return (
    <div className="admin-grid">
      <Link to="/admin/products" className="admin-tile card-surface">
        <h3>Куртки</h3>
        <p className="muted">Добавление, редактирование, удаление моделей и серий.</p>
      </Link>
      <Link to="/admin/users" className="admin-tile card-surface">
        <h3>Пользователи</h3>
        <p className="muted">Список партнёров и ролей.</p>
      </Link>
      <Link to="/admin/orders" className="admin-tile card-surface">
        <h3>Заказы</h3>
        <p className="muted">Статусы и повторная выгрузка накладных.</p>
      </Link>
    </div>
  );
}
