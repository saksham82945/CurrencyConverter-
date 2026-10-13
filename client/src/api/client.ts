import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '' : 'https://currencyconverter-vv8m.onrender.com')
).replace(/\/$/, '');

export const apiClient = axios.create({
  baseURL: apiBaseUrl ? `${apiBaseUrl}/api/v1` : '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper for generating simulated UUIDv4 for Idempotency-Key
export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'idem-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
}

// Request Interceptor: Attach JWT Token and Idempotency Keys on mutations
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('bml_token') || localStorage.getItem('nexapay_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Auto-inject Idempotency-Key for POST, PUT, PATCH, DELETE if not explicitly provided
    const method = config.method?.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method || '') && config.headers) {
      if (!config.headers['Idempotency-Key']) {
        config.headers['Idempotency-Key'] = generateIdempotencyKey();
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Token refresh queue management
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Format errors, refresh expired tokens, and notify state
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const errorCode = error.response?.data?.error?.code;

    // Detect session invalidation / expiration
    const isAuthFailure =
      status === 401 ||
      (status === 403 && errorCode === 'USER_SUSPENDED');

    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (isAuthFailure && !isAuthRoute && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt silent token refresh via httpOnly cookie
        const res = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        const newToken = res.data?.data?.accessToken;

        if (newToken) {
          localStorage.setItem('bml_token', newToken);
          if (res.data?.data?.user) {
            localStorage.setItem('bml_user', JSON.stringify(res.data.data.user));
          }
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          processQueue(null, newToken);
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Clear stale local storage
        localStorage.removeItem('bml_token');
        localStorage.removeItem('bml_user');
        localStorage.removeItem('nexapay_token');
        localStorage.removeItem('nexapay_user');

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('auth:expired', {
              detail: { message: error.response?.data?.error?.message || 'Session expired. Please log in again.' }
            })
          );
        }
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
