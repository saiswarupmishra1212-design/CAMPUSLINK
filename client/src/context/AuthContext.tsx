import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, getAuthToken, setAuthToken, clearAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  loginStudent: (regNo: string, email: string, password: string) => Promise<void>;
  registerStudent: (regNo: string, email: string, password: string) => Promise<void>;
  loginRecruiter: (email: string, password: string, companyId?: number) => Promise<void>;
  loginPlacement: (password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const userData = await api.getMe();
      setUser(userData);
    } catch (err) {
      console.error('Session restoration failed:', err);
      clearAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const loginStudent = async (regNo: string, email: string, password: string) => {
    const data = await api.studentLogin({ regNo, email, password });
    setAuthToken(data.token);
    setUser(data.user);
  };

  const registerStudent = async (regNo: string, email: string, password: string) => {
    const data = await api.studentRegister({ regNo, email, password });
    setAuthToken(data.token);
    setUser(data.user);
  };

  const loginRecruiter = async (email: string, password: string, companyId?: number) => {
    const data = await api.recruiterLogin({ email, password, companyId });
    setAuthToken(data.token);
    setUser(data.user);
  };

  const loginPlacement = async (password: string) => {
    const data = await api.placementLogin({ email: 'admin@campuslink.edu', password });
    setAuthToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        loading,
        loginStudent,
        registerStudent,
        loginRecruiter,
        loginPlacement,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
