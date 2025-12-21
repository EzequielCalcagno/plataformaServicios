import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginApi } from '../services/auth.client';
import { decodeJwtPayload } from '../utils/jwt';
import { mapRolFromId, Role } from '../utils/roles';
import { useNavigation } from '@react-navigation/native';

type SessionState = {
  token: string | null;
  role: Role | null;
  userId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshFromStorage: () => Promise<void>;
};

const SessionContext = createContext<SessionState | undefined>(undefined);
const isRole = (v: any): v is Role => v === 'client' || v === 'professional';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation();
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshFromStorage = async () => {
    setIsLoading(true);
    try {
      const [[, t], [, r], [, uid]] = await AsyncStorage.multiGet(['@token', '@role', '@userId']);
      setToken(t || null);
      setRole(isRole(r) ? r : null);
      setUserId(uid || null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshFromStorage();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const token = await loginApi(email, password);
      const decoded = decodeJwtPayload(token);

      const role = mapRolFromId(decoded?.rolId);
      const userId = decoded?.id ? String(decoded.id) : null;

      await AsyncStorage.multiSet([
        ['@token', token],
        ['@role', role],
        ['@userId', userId ?? ''],
      ]);

      setToken(token);
      setRole(role);
      setUserId(userId);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.multiRemove(['@token', '@role', '@userId']);
      setToken(null);
      setRole(null);
      setUserId(null);
    } finally {
      setIsLoading(false);
    }
    navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
  };

  const value = useMemo(
    () => ({
      token,
      role,
      userId,
      isLoading,
      isAuthenticated: !!token && !isLoading,
      login,
      logout,
      refreshFromStorage,
    }),
    [token, role, userId, isLoading],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
