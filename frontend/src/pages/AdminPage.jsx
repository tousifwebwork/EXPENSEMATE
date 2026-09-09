import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.platformRole !== 'platformAdmin') return;

    api.get('/admin/users')
      .then((response) => setUsers(response.data.users))
      .catch((error) => toast.error(error.response?.data?.message || 'Could not load users'))
      .finally(() => setLoading(false));
  }, [user?.platformRole]);

  if (user?.platformRole !== 'platformAdmin') {
    return <Navigate to="/dashboard" replace />;
  }

  const updateUser = async (userId, field, value) => {
    try {
      const endpoint = field === 'platformRole'
        ? `/admin/users/${userId}/role`
        : `/admin/users/${userId}/status`;
      const response = await api.put(endpoint, { [field]: value });
      setUsers((currentUsers) => currentUsers.map((item) => (
        item.id === userId ? response.data.user : item
      )));
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update user');
    }
  };

  return (
    <main className="page-shell admin-shell">
      <header className="topbar">
        <div>
          <p className="muted">Platform administration</p>
          <h2>Admin access</h2>
        </div>
        <Link className="btn-secondary" to="/dashboard">Back to dashboard</Link>
      </header>

      <section className="card admin-section">
        <div className="section-heading">
          <div>
            <p className="muted">Manage application users</p>
            <h3>Accounts and platform roles</h3>
          </div>
          <span className="user-count">{users.length} users</span>
        </div>
        {loading ? <p className="muted">Loading users...</p> : (
          <div className="table-wrap">
            <table className="user-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((account) => (
                  <tr key={account.id}>
                    <td><strong>{account.name}</strong><span>{account.email}</span></td>
                    <td>
                      <select
                        className="table-select"
                        value={account.platformRole}
                        disabled={account.id === user.id}
                        onChange={(event) => updateUser(account.id, 'platformRole', event.target.value)}
                      >
                        <option value="user">user</option>
                        <option value="platformAdmin">platformAdmin</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="table-select"
                        value={account.accountStatus}
                        disabled={account.id === user.id}
                        onChange={(event) => updateUser(account.id, 'accountStatus', event.target.value)}
                      >
                        <option value="active">active</option>
                        <option value="deactivated">deactivated</option>
                      </select>
                    </td>
                    <td>{new Date(account.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
