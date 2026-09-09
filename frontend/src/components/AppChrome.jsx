import { Bell, BarChart3, CircleUserRound, LayoutDashboard, Users, WalletCards } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/friends', label: 'Friends', icon: Users },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/notifications', label: 'Alerts', icon: Bell },
  { to: '/profile', label: 'Profile', icon: CircleUserRound },
];

export default function AppChrome({ children }) {
  const { user } = useAuth();

  return (
    <div className="app-frame">
      <aside className="app-sidebar">
        <NavLink to="/dashboard" className="brand-lockup">
          <span className="brand-mark"><WalletCards size={20} /></span>
          <span>ExpenseMate</span>
        </NavLink>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={19} strokeWidth={2.2} />
              <span>{label}</span>
            </NavLink>
          ))}
          {user?.platformRole === 'platformAdmin' && <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Users size={19} /><span>Admin</span></NavLink>}
        </nav>
        <div className="sidebar-footer">
          <span className="avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
          <div><strong>{user?.name || 'ExpenseMate user'}</strong><span>{user?.platformRole === 'platformAdmin' ? 'Platform admin' : 'Member'}</span></div>
        </div>
      </aside>
      <div className="app-content">
        <header className="mobile-header">
          <NavLink to="/dashboard" className="brand-lockup"><span className="brand-mark"><WalletCards size={18} /></span><span>ExpenseMate</span></NavLink>
          <NavLink to="/notifications" className="mobile-bell" aria-label="Notifications"><Bell size={20} /></NavLink>
        </header>
        {children}
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {navigation.slice(0, 5).map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `bottom-link ${isActive ? 'active' : ''}`}><Icon size={20} /><span>{label}</span></NavLink>)}
      </nav>
    </div>
  );
}
