import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { setAccessToken, getAccessToken } from '../lib/apiClient';
import { authApi, type LoginPayload } from '../api/auth';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'CANDIDATE' | 'EVALUATOR' | 'ADMIN';
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, try to refresh if we had a session
  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const { accessToken } = await authApi.refresh();
        setAccessToken(accessToken);
        
        // Safely decode JWT (handles base64url -/_, padding, and unicode)
        const base64Url = accessToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);

        setUser({
          id: payload.userId || payload.sub || payload.id,
          email: payload.sub || payload.email,
          fullName: payload.fullName || payload.name || payload.sub || '',
          role: payload.role,
        });
      } catch (err) {
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    tryRefresh();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authApi.login(payload);
    setAccessToken(response.accessToken);
    setUser({
      id: response.user.id,
      email: response.user.email,
      fullName: response.user.fullName,
      role: response.user.role,
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!getAccessToken(),
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
