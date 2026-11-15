import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('csms_token');
    if (!token) {
      setLoading(false);
      return;
    }

    let active = true;
    api.get('/auth/me')
      .then((response) => {
        if (active) setUser(response.data.data.user);
      })
      .catch((error) => {
        // Drop the session only when the server rejected the token.
        // A down backend (ECONNREFUSED / ECONNRESET) must not log the user out.
        const status = error?.response?.status;
        if (status === 401) {
          localStorage.removeItem('csms_token');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    setUser,
    async login(email, password) {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('csms_token', response.data.data.token);
      setUser(response.data.data.user);
      return response.data.data.user;
    },
    async register(payload) {
      const response = await api.post('/auth/register', payload);
      localStorage.setItem('csms_token', response.data.data.token);
      setUser(response.data.data.user);
      return response.data.data.user;
    },
    logout() {
      localStorage.removeItem('csms_token');
      setUser(null);
    }
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
