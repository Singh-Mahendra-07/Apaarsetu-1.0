import { apiClient } from './api-client';
import {
  LoginRequest,
  LoginResponse,
  MfaVerifyRequest,
  MfaSetupResponse,
  MfaEnableRequest,
  RefreshTokenRequest,
  UserProfileDTO,
  FirstTimePasswordResetRequest,
} from '@/types/api';

export const authApi = {
  // Login with email & password
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const data = await apiClient.post<LoginResponse>('/auth/login', credentials);
    if (data.accessToken) {
      apiClient.setTokens(data.accessToken, data.refreshToken, data.user);
    }
    return data;
  },

  // Verify TOTP during login MFA challenge
  async verifyMfa(request: MfaVerifyRequest): Promise<LoginResponse> {
    const data = await apiClient.post<LoginResponse>('/auth/mfa/verify', request);
    if (data.accessToken) {
      apiClient.setTokens(data.accessToken, data.refreshToken, data.user);
    }
    return data;
  },

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const data = await apiClient.post<LoginResponse>('/auth/refresh', {
      refreshToken,
    } as RefreshTokenRequest);
    if (data.accessToken) {
      apiClient.setTokens(data.accessToken, data.refreshToken, data.user);
    }
    return data;
  },

  // Get current user profile
  async getMe(): Promise<UserProfileDTO> {
    const user = await apiClient.get<UserProfileDTO>('/auth/me');
    if (user) {
      const currentToken = apiClient.getAccessToken();
      const currentRefresh = apiClient.getRefreshToken();
      if (currentToken) {
        apiClient.setTokens(currentToken, currentRefresh || undefined, user);
      }
    }
    return user;
  },

  // Setup MFA (generates QR code and secret)
  async setupMfa(): Promise<MfaSetupResponse> {
    return apiClient.post<MfaSetupResponse>('/auth/mfa/setup');
  },

  // Enable MFA after verifying TOTP against secret
  async enableMfa(request: MfaEnableRequest): Promise<string> {
    return apiClient.post<string>('/auth/mfa/enable', request);
  },

  // Reset first-time temporary password and establish permanent access
  async resetFirstTimePassword(request: FirstTimePasswordResetRequest): Promise<LoginResponse> {
    const data = await apiClient.post<LoginResponse>('/auth/first-time-password', request);
    if (data.accessToken) {
      apiClient.setTokens(data.accessToken, data.refreshToken, data.user);
    }
    return data;
  },

  // Logout & invalidate token on server
  async logout(): Promise<void> {
    try {
      await apiClient.post<string>('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      apiClient.clearSession();
    }
  },
};
