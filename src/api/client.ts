import type { AuthResponse, Category, Expense, ExpenseApi, ExpenseInput, MonthlyReport, Page } from './types';

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly fieldErrors: Record<string, string> = {}) {
    super(message);
  }
}

/**
 * HTTP client for the Spring Boot expense-tracker-api.
 * The JWT is supplied by a getter so the client always uses the current session token.
 */
export function createHttpApi(baseUrl: string, getToken: () => string | null, onUnauthorized?: () => void): ExpenseApi {
  async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = getToken();
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers as Record<string, string> | undefined),
      },
    });
    if (res.status === 401 && token) onUnauthorized?.();
    if (!res.ok) {
      let body: { detail?: string; title?: string; errors?: Record<string, string> } = {};
      try { body = await res.json(); } catch { /* empty body */ }
      throw new ApiError(body.detail ?? body.title ?? `Request failed (${res.status})`, res.status, body.errors);
    }
    return (res.status === 204 ? undefined : await res.json()) as T;
  }

  return {
    mode: 'live',
    login: (email, password) =>
      call<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (fullName, email, password) =>
      call<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify({ fullName, email, password }) }),
    categories: () => call<Category[]>('/api/categories'),
    createCategory: (name) => call<Category>('/api/categories', { method: 'POST', body: JSON.stringify({ name }) }),
    expenses: (page, size = 20) => call<Page<Expense>>(`/api/expenses?page=${page}&size=${size}`),
    createExpense: (input: ExpenseInput) => call<Expense>('/api/expenses', { method: 'POST', body: JSON.stringify(input) }),
    deleteExpense: (id) => call<void>(`/api/expenses/${id}`, { method: 'DELETE' }),
    monthlyReport: (year, month) => call<MonthlyReport>(`/api/reports/monthly?year=${year}&month=${month}`),
  };
}
