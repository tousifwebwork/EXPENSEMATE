import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ name: user.name || '', phone: user.phone || '', preferredCurrency: user.preferredCurrency || 'INR' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });

  const updateProfile = async (event) => {
    event.preventDefault();
    try {
      const response = await api.put('/auth/profile', profile);
      updateUser(response.data.user);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update profile');
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    try {
      await api.put('/auth/password', passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      toast.success('Password changed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not change password');
    }
  };

  return (
    <main className="page-shell admin-shell">
      <header className="topbar"><div><p className="muted">Account</p><h2>Your profile</h2></div><Link className="btn-secondary" to="/dashboard">Back to dashboard</Link></header>
      <div className="workspace-grid">
        <form className="card workflow-card page-section" onSubmit={updateProfile}>
          <h3>Personal details</h3>
          <label>Name<input className="input" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} required /></label>
          <label>Email<input className="input" value={user.email} disabled /></label>
          <label>Phone<input className="input" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label>
          <label>Preferred currency<select className="input" value={profile.preferredCurrency} onChange={(event) => setProfile({ ...profile, preferredCurrency: event.target.value })}><option>INR</option><option>USD</option><option>EUR</option><option>GBP</option></select></label>
          <button className="btn-primary" type="submit">Save profile</button>
        </form>
        <form className="card workflow-card page-section" onSubmit={changePassword}>
          <h3>Change password</h3>
          <label>Current password<input className="input" type="password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} required /></label>
          <label>New password<input className="input" type="password" minLength="8" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} required /></label>
          <button className="btn-primary" type="submit">Change password</button>
        </form>
      </div>
    </main>
  );
}
