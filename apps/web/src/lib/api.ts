const API_BASE_URL = 'http://localhost:4000/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
  };
  requestId: string;
}

export function getAuthToken(): string | null {
  return localStorage.getItem('harvesttrust_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('harvesttrust_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('harvesttrust_token');
}

export function getLoggedInUser() {
  const userJson = localStorage.getItem('harvesttrust_user');
  return userJson ? JSON.parse(userJson) : null;
}

export function setLoggedInUser(user: any) {
  localStorage.setItem('harvesttrust_user', JSON.stringify(user));
}

export function removeLoggedInUser() {
  localStorage.removeItem('harvesttrust_user');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    const err = new Error(json.error?.message || 'API request failed') as any;
    err.code = json.error?.code;
    err.fieldErrors = json.error?.fieldErrors;
    err.statusCode = response.status;
    throw err;
  }

  return json.data as T;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
