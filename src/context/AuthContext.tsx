import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Permission, Role } from '../types/index.ts';
import { authApi } from '../services/apiServices.ts';
import { tokenStorage } from '../services/apiClient.ts';

interface AuthContextType {
  currentUser: User | null;
  availableUsers: User[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchUser: (email: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: Role | Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const initAuth = async () => {
    try {
      const [meRes, usersRes] = await Promise.all([authApi.getMe(), authApi.getUsers()]);
      setCurrentUser(meRes.user);
      setAvailableUsers(usersRes.users);
      if (meRes.user && !tokenStorage.getToken()) {
        // Seed initial session token for seamless refresh survival
        tokenStorage.setToken(`jwt-session-${meRes.user.email}`);
      }
    } catch (err) {
      console.error('Failed to load initial user context', err);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const res = await authApi.login(email, password);
      if (res.success && res.user) {
        if (res.token) {
          tokenStorage.setToken(res.token);
        }
        setCurrentUser(res.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid credentials' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Authentication failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authApi.logout();
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      tokenStorage.clearToken();
      setCurrentUser(null);
      setIsLoading(false);
    }
  };

  const switchUser = async (email: string) => {
    try {
      setIsLoading(true);
      const res = await authApi.switchUser(email);
      if (res.success) {
        if (res.token) {
          tokenStorage.setToken(res.token);
        }
        setCurrentUser(res.user);
      }
    } catch (err) {
      console.error('Failed to switch user role', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    await initAuth();
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'SYSTEM_ADMIN') return true;
    return currentUser.permissions.includes(permission);
  };

  const hasRole = (role: Role | Role[]): boolean => {
    if (!currentUser) return false;
    if (Array.isArray(role)) {
      return role.includes(currentUser.role);
    }
    return currentUser.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        availableUsers,
        isLoading,
        isAuthenticated: !!currentUser,
        login,
        logout,
        switchUser,
        refreshSession,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
