import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = async () => {
    const response = await api.get('/notifications');
    setNotifications(response.data.notifications);
    setUnreadCount(response.data.unreadCount);
  };

  useEffect(() => {
    load().catch((error) => toast.error(error.response?.data?.message || 'Could not load notifications'));
  }, []);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    await load();
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    await load();
  };

  return (
    <main className="page-shell admin-shell">
      <header className="topbar"><div><p className="muted">Updates</p><h2>Notifications {unreadCount > 0 && `(${unreadCount})`}</h2></div><div className="button-row"><button className="btn-secondary" type="button" onClick={markAllRead} disabled={!unreadCount}>Mark all read</button><Link className="btn-secondary" to="/dashboard">Back to dashboard</Link></div></header>
      <section className="card workflow-card page-section">
        {notifications.length ? notifications.map((notification) => <button type="button" className={`notification-row ${notification.read ? '' : 'unread'}`} key={notification._id} onClick={() => !notification.read && markRead(notification._id)}><strong>{notification.message}</strong><span>{new Date(notification.createdAt).toLocaleString()}</span></button>) : <p className="muted">You have no notifications.</p>}
      </section>
    </main>
  );
}
