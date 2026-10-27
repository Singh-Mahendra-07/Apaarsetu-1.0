'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfileDTO, UserRole, LoginResponse } from '@/types/api';
import { authApi, apiClient } from '@/lib/api';
import PasswordResetModal from '@/components/auth/PasswordResetModal';

interface AuthContextType {
  user: UserProfileDTO | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresPasswordChange: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  verifyMfa: (userId: string, otpCode: string, challengeToken?: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfileDTO | null>;
  resetFirstTimePassword: (newPassword: string, confirmPassword?: string) => Promise<LoginResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfileDTO | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session from storage and verify with backend
  const initSession = useCallback(async () => {
    const storedToken = apiClient.getAccessToken();
    const storedUser = apiClient.getUserProfile();

    if (storedToken) {
      setToken(storedToken);
      if (storedUser) setUser(storedUser);

      try {
        const freshUser = await authApi.getMe();
        setUser(freshUser);
      } catch {
        // Token might have expired
        apiClient.clearSession();
        setUser(null);
        setToken(null);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initSession();
  }, [initSession]);

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    setIsLoading(true);
    try {
      const resp = await authApi.login({ email, password });
      if (resp.mfaRequired && (resp.mfaChallengeToken || resp.mfaToken)) {
        setChallengeToken(resp.mfaChallengeToken || resp.mfaToken || null);
      }
      if (resp.accessToken) {
        setToken(resp.accessToken);
        setUser(resp.user);
        setChallengeToken(null);
      }
      return resp;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMfa = async (userId: string, otpCode: string, tokenOverride?: string): Promise<LoginResponse> => {
    setIsLoading(true);
    try {
      const activeChallenge = tokenOverride || challengeToken || '';
      const resp = await authApi.verifyMfa({
        userId,
        otpCode,
        challengeToken: activeChallenge,
        mfaToken: activeChallenge,
      });
      if (resp.accessToken) {
        setToken(resp.accessToken);
        setUser(resp.user);
        setChallengeToken(null);
      }
      return resp;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }
  };

  const refreshProfile = async (): Promise<UserProfileDTO | null> => {
    try {
      const freshUser = await authApi.getMe();
      setUser(freshUser);
      return freshUser;
    } catch {
      return null;
    }
  };

  const resetFirstTimePassword = async (
    newPassword: string,
    confirmPassword?: string
  ): Promise<LoginResponse> => {
    setIsLoading(true);
    try {
      const resp = await authApi.resetFirstTimePassword({ newPassword, confirmPassword });
      if (resp.user) {
        setUser(resp.user);
      }
      if (resp.accessToken) {
        setToken(resp.accessToken);
      }
      return resp;
    } finally {
      setIsLoading(false);
    }
  };

  const role = user?.role || null;
  const requiresPasswordChange = Boolean(user?.requiresPasswordChange);
  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated,
        isLoading,
        requiresPasswordChange,
        login,
        verifyMfa,
        logout,
        refreshProfile,
        resetFirstTimePassword,
      }}
    >
      {children}
      {isAuthenticated && requiresPasswordChange && <PasswordResetModal />}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
