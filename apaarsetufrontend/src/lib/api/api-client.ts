/**
 * Centralized API Client for APAARSetu
 * Handles requests, headers, JWT tokens, errors, and JSON/multipart payloads
 */

import { ApiResponse, UserProfileDTO } from '@/types/api';

const TOKEN_KEY = 'apaarsetu_access_token';
const REFRESH_TOKEN_KEY = 'apaarsetu_refresh_token';
const USER_KEY = 'apaarsetu_user_profile';

export class ApiError extends Error {
  public status: number;
  public errorCode?: string;
  public details?: unknown;

  constructor(message: string, status: number, errorCode?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}

class ApiClient {
  private baseUrl: string;
  private cachedRawUser: string | null = null;
  private cachedParsedUser: UserProfileDTO | null = null;

  constructor() {
    // Trim trailing slashes from configured base URL
    const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081/api/v1';
    this.baseUrl = envUrl.replace(/\/+$/, '');
  }

  // Token Management (Safe for SSR & Browser)
  public getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  public getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  public getUserProfile(): UserProfileDTO | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      this.cachedRawUser = null;
      this.cachedParsedUser = null;
      return null;
    }
    if (raw === this.cachedRawUser && this.cachedParsedUser) {
      return this.cachedParsedUser;
    }
    try {
      this.cachedParsedUser = JSON.parse(raw);
      this.cachedRawUser = raw;
      return this.cachedParsedUser;
    } catch {
      this.cachedRawUser = null;
      this.cachedParsedUser = null;
      return null;
    }
  }

  public setTokens(accessToken: string, refreshToken?: string, user?: UserProfileDTO): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, accessToken);
    const secureFlag = window.location?.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(accessToken)}; path=/; SameSite=Lax${secureFlag}`;
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      document.cookie = `${REFRESH_TOKEN_KEY}=${encodeURIComponent(refreshToken)}; path=/; SameSite=Lax${secureFlag}`;
    }
    if (user) {
      const userStr = JSON.stringify(user);
      this.cachedParsedUser = user;
      this.cachedRawUser = userStr;
      localStorage.setItem(USER_KEY, userStr);
      document.cookie = `apaarsetu_user_role=${encodeURIComponent(user.role)}; path=/; SameSite=Lax${secureFlag}`;
    }
  }

  public clearSession(): void {
    this.cachedRawUser = null;
    this.cachedParsedUser = null;
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${REFRESH_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `apaarsetu_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  // Core Request Helper
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    // Auto-inject Bearer Token if present
    const token = this.getAccessToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Set JSON content-type if body is not FormData
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Special handling for 401 Unauthorized
      if (response.status === 401) {
        // Clear session if unauthorized and not in login call
        if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
          this.clearSession();
        }
      }

      // Handle NoContent (204)
      if (response.status === 204) {
        return {} as T;
      }

      // Parse JSON
      const json: ApiResponse<T> = await response.json().catch(() => ({
        success: response.ok,
        message: response.statusText,
        data: null as unknown as T,
      }));

      if (!response.ok || json.success === false) {
        const errorMsg = json.message || `Request failed with status ${response.status}`;
        throw new ApiError(errorMsg, response.status, json.errorCode, json.data);
      }

      return json.data !== undefined ? json.data : (json as unknown as T);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err;
      }
      const message = err instanceof Error ? err.message : 'Network communication failed';
      throw new ApiError(message, 0, 'NETWORK_ERROR');
    }
  }

  // HTTP Method Wrappers
  public async get<T>(endpoint: string, queryParams?: Record<string, string | number | boolean | undefined | null>): Promise<T> {
    let url = endpoint;
    if (queryParams) {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  public async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // Multipart Form Data Upload
  public async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers: Record<string, string> = {};

    const token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Do NOT set Content-Type header so the browser sets the boundary automatically
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const json = await response.json().catch(() => ({
      success: response.ok,
      message: response.statusText,
      data: null,
    }));

    if (!response.ok || json.success === false) {
      throw new ApiError(json.message || 'File upload failed', response.status, json.errorCode);
    }

    return json.data !== undefined ? json.data : (json as unknown as T);
  }

  // Blob Download (e.g. CSV reports, batch template)
  public async downloadBlob(endpoint: string, queryParams?: Record<string, string>): Promise<Blob> {
    let url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    if (queryParams) {
      const sp = new URLSearchParams(queryParams);
      url += (url.includes('?') ? '&' : '?') + sp.toString();
    }

    const headers: Record<string, string> = {};
    const token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new ApiError(`Download failed with status ${res.status}`, res.status);
    }
    return res.blob();
  }
}

export const apiClient = new ApiClient();
