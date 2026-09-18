import { useAppDispatch, useAppSelector } from '../store/hooks';
import { removeUser, selectUsers } from '../store/slices/usersSlice';

export function AdminUsersPage() {
  const users = useAppSelector(selectUsers);
  const dispatch = useAppDispatch();

  return (
    <div className="card-surface" style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            <th>Имя</th>
            <th>Email</th>
            <th>Телефон</th>
            <th>Страна</th>
            <th>Роли</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>
                {u.firstName} {u.lastName}
              </td>
              <td>{u.email}</td>
              <td>{u.phoneNumber}</td>
              <td>{u.country}</td>
              <td>{u.roles.join(', ')}</td>
              <td>
                {u.roles.includes('Admin') ? (
                  <span className="badge">Admin</span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => dispatch(removeUser(u.id))}
                  >
                    Удалить
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
