const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const TOKEN_STORAGE_KEY = 'catatan_keuangan_token';

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: string;
  currency: string;
  occurred_at: string;
  description: string | null;
  account_id: string;
  category_id: string | null;
  source: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  is_system: boolean;
}

export interface Summary {
  period: string;
  currency: string;
  income_total: string;
  expense_total: string;
  net_cash_flow: string;
  transaction_count: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
  timezone: string;
}

export interface MeResponse {
  data: User;
  meta: { request_id: string };
}

export interface AuthResponse {
  data: { user: User; token: string };
  message: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta: { request_id: string };
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

function removeToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

class ApiClient {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    // Auto-add token jika ada
    const token = getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    // Handle 401 - token tidak valid/hilang
    if (response.status === 401) {
      removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    if (!response.ok) {
      try {
        const error: ApiError = await response.json();
        throw new Error(`${error.error.code}: ${error.error.message}`);
      } catch {
        throw new Error('Terjadi kesalahan pada server.');
      }
    }

    return response.json();
  }

  static async fetchTransactions(params?: {
    type?: TransactionType;
    from?: string;
    to?: string;
    page?: number;
    per_page?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.per_page) query.set('per_page', params.per_page.toString());

    return this.request<{
      data: Transaction[];
      meta: {
        current_page: number;
        last_page: number;
        total: number;
        request_id: string;
      };
    }>(`/transactions${query.toString() ? `?${query.toString()}` : ''}`);
  }

  static async createTransaction(data: {
    type: TransactionType;
    amount: string;
    occurred_at: string;
    account_id: string;
    category_id?: string | null;
    description?: string;
    idempotency_key?: string;
  }) {
    return this.request<{ data: Transaction }>(`/transactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async fetchCategories() {
    return this.request<{ data: Category[] }>('/categories');
  }

  static async fetchSummary(from?: string, to?: string) {
    const query = new URLSearchParams();
    if (from) query.set('from', from);
    if (to) query.set('to', to);

    return this.request<{ data: Summary }>(`/summary${query.toString() ? `?${query.toString()}` : ''}`);
  }

  static async fetchMe() {
    return this.request<MeResponse>('/me');
  }

  // Auth methods
  static async register(name: string, email: string, password: string) {
    return this.request<AuthResponse>('/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  static async login(email: string, password: string) {
    const response = await this.request<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    // Save token
    if (response.data.token) {
      setToken(response.data.token);
    }
    return response;
  }

  static logout() {
    removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}

export default ApiClient;
