const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const TOKEN_STORAGE_KEY = 'catatan_keuangan_token';

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  kind?: 'income' | 'expense' | 'adjustment' | string;
  counts_in_report?: boolean;
  amount: string;
  currency: string;
  occurred_at: string;
  description: string | null;
  image_path: string | null;
  image_url: string | null;
  account_id: string;
  category_id: string | null;
  source: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  is_system: boolean;
  transaction_count?: number;
}

export interface Account {
  id: string;
  name: string;
  balance: string;
  initial_balance?: string;
  mutasi?: string;
  currency: string;
}

export interface Budget {
  id: string;
  category_id: string | null;
  category_name: string | null;
  amount: string;
  spent: string;
  remaining: string;
  percent_used: number;
  status: 'aman' | 'waspada' | 'lewat';
  warn_at_percent: number;
  starts_month: string | null;
  aktif: boolean;
  month: string;
  applicable: boolean;
}

export interface RecurringItem {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'adjustment';
  amount: string;
  currency: string;
  frequency: 'weekly' | 'monthly' | 'every_n_months' | 'yearly';
  interval: number;
  day_of_month: number | null;
  start_date: string | null;
  end_date: string | null;
  next_run_at: string;
  auto_post: boolean;
  is_active: boolean;
  problem: string | null;
  account_id: string | null;
  account_name: string | null;
  category_id: string | null;
  category_name: string | null;
}

export interface Transfer {
  id: string;
  from_account_id: string;
  from_account_name: string | null;
  to_account_id: string;
  to_account_name: string | null;
  amount: string;
  fee: string;
  fee_category_id: string | null;
  fee_category_name: string | null;
  description: string | null;
  occurred_at: string;
  created_at: string;
  updated_at: string;
}

export interface TransferLeg {
  leg: 'in' | 'out';
  transfer_id: string;
  direction_label: string;
  amount: string;
  fee: string;
  description: string | null;
  occurred_at: string;
  from_account_id: string;
  to_account_id: string;
  from_account_name: string | null;
  to_account_name: string | null;
}

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read_at: string | null;
  created_at: string;
}

export interface ApiToken {
  id: string;
  name: string;
  abilities: string[];
  token: string | null;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  object_type: string | null;
  object_id: string | null;
  result: string;
  ip_address: string | null;
  created_at: string;
}

export interface AdminSettings {
  site_name: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  default_currency: string;
  max_api_tokens_per_user: number;
}

export interface Summary {
  period: { from: string; to: string };
  currency: string;
  income_total: string;
  expense_total: string;
  net_cash_flow: string;
  adjustment_total?: string;
  transfer_total?: string;
  transaction_count: number;
  expense_by_category?: Array<{
    category_id: string | null;
    category_name: string;
    total: number;
  }>;
  income_by_category?: Summary["expense_by_category"];
}

export interface MonthlyReport {
  period: { month: string; from: string; to: string };
  currency: string;
  summary: {
    period: { from: string; to: string };
    currency: string;
    income_total: number;
    expense_total: number;
    net_cash_flow: number;
    adjustment_total: number;
    transfer_total: number;
    transaction_count: number;
    income_by_category: Array<{ category_id: string | null; category_name: string; total: number }>;
    expense_by_category: Array<{ category_id: string | null; category_name: string; total: number }>;
  };
  previous_month: MonthlyReport["summary"];
  accounts: Array<{
    account_id: string;
    account_name: string;
    initial_balance: number;
    opening_balance: number;
    mutasi: number;
    closing_balance: number;
  }>;
  top_expenses: Array<{
    transaction_id: string;
    date: string;
    description: string | null;
    category_name: string | null;
    account_name: string | null;
    amount: number;
  }>;
}

export interface TrendPoint {
  label: string;
  from: string;
  to: string;
  income: number;
  expense: number;
}

export interface CategoryStat {
  category_id: string | null;
  category_name: string;
  total: number;
  percent: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  is_active?: boolean;
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

export interface BudgetInput {
  category_id: string;
  amount: string;
  starts_month?: string | null;
  warn_at_percent?: number;
  aktif?: boolean;
}

export interface RecurringInput {
  name: string;
  type?: 'income' | 'expense' | 'adjustment';
  amount: string;
  account_id: string;
  category_id?: string | null;
  frequency: 'weekly' | 'monthly' | 'every_n_months' | 'yearly';
  interval?: number;
  day_of_month?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  auto_post?: boolean;
  is_active?: boolean;
}

class ApiClient {
  static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

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
    kind?: string;
    from?: string;
    to?: string;
    account_id?: string;
    page?: number;
    per_page?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.kind) query.set('kind', params.kind);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.account_id) query.set('account_id', params.account_id);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.per_page) query.set('per_page', params.per_page.toString());

    return this.request<{
      data: Transaction[];
      transfer_legs: TransferLeg[];
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
    kind?: 'income' | 'expense' | 'adjustment';
    amount: string;
    occurred_at: string;
    account_id: string;
    category_id?: string | null;
    description?: string;
    idempotency_key?: string;
  }) {
    const payload: Record<string, unknown> = { ...data };
    if (data.kind) payload.kind = data.kind;
    return this.request<{ data: Transaction }>(`/transactions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  static async deleteTransaction(id: string) {
    return this.request<{ message: string }>(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  static async uploadTransactionImage(id: string, file: File) {
    const form = new FormData();
    form.append('image', file);
    return this.request<{ data: Transaction }>(`/transactions/${id}/image`, {
      method: 'POST',
      body: form,
    });
  }

  static async deleteTransactionImage(id: string) {
    return this.request<{ message: string }>(`/transactions/${id}/image`, {
      method: 'DELETE',
    });
  }

  static async fetchCategories() {
    return this.request<{ data: Category[]; meta: { uncategorized_count?: number } }>('/categories');
  }

  static async createCategory(data: { name: string; type: 'income' | 'expense' }) {
    return this.request<{ data: Category }>(`/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateCategory(id: string, data: { name: string }) {
    return this.request<{ data: Category }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async mergeCategory(sourceId: string, targetId: string) {
    return this.request<{ data: Category }>(`/categories/${sourceId}/merge`, {
      method: 'POST',
      body: JSON.stringify({ target_id: targetId }),
    });
  }

  static async previewMergeCategory(sourceId: string, targetId: string) {
    return this.request<{
      data: {
        source: Category;
        target: Category;
        transactions_to_move: number;
        earliest_date: string | null;
      };
    }>(`/categories/${sourceId}/merge-preview?target_id=${targetId}`);
  }

  static async deleteCategory(id: string) {
    return this.request<{ message: string }>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  static async fetchSummary(from?: string, to?: string) {
    const query = new URLSearchParams();
    if (from) query.set('from', from);
    if (to) query.set('to', to);

    return this.request<{ data: Summary }>(`/summary${query.toString() ? `?${query.toString()}` : ''}`);
  }

  static async fetchAccounts() {
    return this.request<{ data: Account[] }>('/accounts');
  }

  static async createAccount(data: { name: string; balance?: string; initial_balance?: string; currency?: string }) {
    const payload: Record<string, unknown> = { name: data.name, currency: data.currency };
    if (data.initial_balance !== undefined) payload.initial_balance = data.initial_balance;
    else if (data.balance !== undefined) payload.balance = data.balance;
    return this.request<{ data: Account }>(`/accounts`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  static async updateAccount(id: string, data: { name?: string; initial_balance?: string }) {
    return this.request<{ data: Account }>(`/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async fetchBudgets(month?: string) {
    return this.request<{ data: Budget[] }>(`/budgets${month ? `?month=${month}` : ''}`);
  }

  static async createBudget(data: BudgetInput) {
    return this.request<{ data: Budget }>(`/budgets`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateBudget(id: string, data: Partial<BudgetInput>) {
    return this.request<{ data: Budget }>(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteBudget(id: string) {
    return this.request<{ message: string }>(`/budgets/${id}`, {
      method: 'DELETE',
    });
  }

  static async fetchRecurrings() {
    return this.request<{ data: RecurringItem[] }>('/recurrings');
  }

  static async createRecurring(data: RecurringInput) {
    return this.request<{ data: RecurringItem }>(`/recurrings`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateRecurring(id: string, data: Partial<RecurringInput>) {
    return this.request<{ data: RecurringItem }>(`/recurrings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteRecurring(id: string) {
    return this.request<{ message: string }>(`/recurrings/${id}`, {
      method: 'DELETE',
    });
  }

  static async skipRecurring(id: string) {
    return this.request<{ data: RecurringItem }>(`/recurrings/${id}/skip`, {
      method: 'POST',
    });
  }

  static async runNowRecurring(id: string) {
    return this.request<{ data: RecurringItem }>(`/recurrings/${id}/run-now`, {
      method: 'POST',
    });
  }

  static async fetchTransfers(params?: { month?: string; from?: string; to?: string; account_id?: string }) {
    const query = new URLSearchParams();
    if (params?.month) query.set('month', params.month);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.account_id) query.set('account_id', params.account_id);

    return this.request<{ data: Transfer[]; meta: { total: number; current_page: number; last_page: number; request_id: string } }>(
      `/transfers${query.toString() ? `?${query.toString()}` : ''}`
    );
  }

  static async createTransfer(data: {
    from_account_id: string;
    to_account_id: string;
    amount: string;
    fee?: string;
    fee_category_id?: string | null;
    occurred_at: string;
    description?: string;
    idempotency_key?: string;
  }) {
    return this.request<{ data: Transfer }>(`/transfers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateTransfer(id: string, data: Partial<{
    from_account_id: string;
    to_account_id: string;
    amount: string;
    fee?: string;
    fee_category_id?: string | null;
    occurred_at: string;
    description?: string;
  }>) {
    return this.request<{ data: Transfer }>(`/transfers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async deleteTransfer(id: string) {
    return this.request<{ message: string }>(`/transfers/${id}`, {
      method: 'DELETE',
    });
  }

  static async fetchNotifications() {
    return this.request<{ data: UserNotification[]; meta: { unread_count: number } }>('/notifications');
  }

  static async markNotificationRead(id: string) {
    return this.request<{ data: UserNotification }>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  static async markAllNotificationsRead() {
    return this.request<{ message: string }>(`/notifications/read-all`, {
      method: 'PUT',
    });
  }

  static async deleteNotification(id: string) {
    return this.request<{ message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  static async fetchApiTokens() {
    return this.request<{ data: ApiToken[] }>('/api-tokens');
  }

  static async createApiToken(data: { name: string; abilities: string[] }) {
    return this.request<{ data: ApiToken & { token: string } }>(`/api-tokens`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async revokeApiToken(id: string) {
    return this.request<{ message: string }>(`/api-tokens/${id}`, {
      method: 'DELETE',
    });
  }

  static async fetchAuditLogs(params?: { page?: number; per_page?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.per_page) query.set('per_page', params.per_page.toString());

    return this.request<{ data: AuditLog[]; meta: { total: number; current_page: number; last_page: number } }>(
      `/admin/audit-logs${query.toString() ? `?${query.toString()}` : ''}`
    );
  }

  static async fetchApiMetrics() {
    return this.request<{
      data: Array<{ hour: string; requests: number; avg_response_time: number; errors: number }>;
      meta: { period: string };
    }>('/admin/api-metrics');
  }

  static async fetchSystemHealth() {
    return this.request<{
      data: {
        database_connected: boolean;
        active_api_tokens: number;
        expired_tokens: number;
        system_time: string;
        environment: string;
      };
    }>('/admin/system-health');
  }

  static async fetchPdfTemplates() {
    return this.request<{
      data: Array<{ id: string; name: string; type: string; is_default: boolean; created_at: string }>;
    }>('/admin/pdf-templates');
  }

  static async createPdfTemplate(data: { name: string; type: string }) {
    return this.request<{ data: unknown }>(`/admin/pdf-templates`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deletePdfTemplate(id: string) {
    return this.request<{ message: string }>(`/admin/pdf-templates/${id}`, {
      method: 'DELETE',
    });
  }

  static async fetchAdminSettings() {
    return this.request<{
      data: AdminSettings;
    }>('/admin/settings');
  }

  static async updateAdminSettings(data: Partial<AdminSettings>) {
    return this.request<{ message: string }>(`/admin/settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async fetchMe() {
    return this.request<MeResponse>('/me');
  }

  static async updateMe(data: { name: string }) {
    return this.request<MeResponse>(`/me`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Auth methods
  static async register(name: string, email: string, password: string) {
    const response = await this.request<AuthResponse>('/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    // Save token otomatis agar bisa langsung masuk dashboard
    if (response.data.token) {
      setToken(response.data.token);
    }
    return response;
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

  // Download laporan PDF
  static async downloadReport(from: string, to: string): Promise<Blob> {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/reports/export-pdf?from=${from}&to=${to}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => null);
      throw new Error(error ? `${error.error.code}: ${error.error.message}` : 'Gagal mengunduh laporan.');
    }
    return response.blob();
  }

  // F-08: laporan bulanan
  static async fetchMonthlyReport(month: string) {
    return this.request<{ data: MonthlyReport }>(`/reports/monthly?month=${month}`);
  }

  static async downloadMonthlyReport(month: string, format: 'pdf' | 'xlsx'): Promise<Blob> {
    const token = getToken();
    const response = await fetch(
      `${API_BASE_URL}/reports/monthly/export?month=${month}&format=${format}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => null);
      throw new Error(error ? `${error.error.code}: ${error.error.message}` : 'Gagal mengunduh laporan.');
    }
    return response.blob();
  }

  // F-09: data grafik dashboard
  static async fetchTrend(range: '6m' | 'week' = '6m') {
    return this.request<{ data: TrendPoint[] }>(`/stats/trend?range=${range}`);
  }

  static async fetchCategoryStats(month: string, type: 'income' | 'expense' = 'expense') {
    return this.request<{
      data: { month: string; type: string; total: number; items: CategoryStat[] };
    }>(`/stats/by-category?month=${month}&type=${type}`);
  }

  static async fetchTopExpenses(month: string, limit = 5) {
    return this.request<{
      data: { month: string; items: MonthlyReport["top_expenses"] };
    }>(`/stats/top-expenses?month=${month}&limit=${limit}`);
  }

  // Admin methods
  static async fetchAdminUsers(params?: { page?: number; per_page?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.per_page) query.set('per_page', params.per_page.toString());

    return this.request<{
      data: Array<{
        id: number;
        name: string;
        email: string;
        role: string;
        is_active: boolean;
        created_at: string;
      }>;
      meta: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        request_id: string;
      };
    }>(`/admin/users${query.toString() ? `?${query.toString()}` : ''}`);
  }

  static async fetchAdminDashboardStats() {
    return this.request<{
      data: {
        total_users: number;
        active_users: number;
        new_users_last_7_days: number;
        api_requests_24h: number;
        error_rate_percent: number;
        total_transactions: number;
        recent_audit_logs: number;
      };
      meta: {
        request_id: string;
        period: string;
        updated_at: string;
      };
    }>('/admin/dashboard');
  }
}

export default ApiClient;
