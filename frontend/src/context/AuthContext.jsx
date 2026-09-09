import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('expensemate_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    const token = localStorage.getItem('expensemate_token');
    if (!token) return;

    api.get('/auth/me')
      .then((response) => {
        const currentUser = response.data.user;
        localStorage.setItem('expensemate_user', JSON.stringify(currentUser));
        setUser(currentUser);
      })
      .catch(() => {
        localStorage.removeItem('expensemate_token');
        localStorage.removeItem('expensemate_user');
        setUser(null);
      });
  }, []);

  const login = ({ token, user: nextUser }) => {
    localStorage.setItem('expensemate_token', token);
    localStorage.setItem('expensemate_user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem('expensemate_token');
    localStorage.removeItem('expensemate_user');
    setUser(null);
  };

  const updateUser = (nextUser) => {
    localStorage.setItem('expensemate_user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      updateUser,
      isAuthenticated: Boolean(user),
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
