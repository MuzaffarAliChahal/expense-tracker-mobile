export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

export interface Category {
  id: number;
  name: string;
}

export interface Expense {
  id: number;
  amount: number;
  description: string | null;
  spentOn: string; // yyyy-mm-dd
  categoryId: number | null;
  categoryName: string | null;
}

export interface ExpenseInput {
  amount: number;
  description?: string;
  spentOn: string;
  categoryId?: number | null;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  total: number;
  count: number;
  byCategory: { category: string | null; total: number; count: number }[];
}

/** Everything the screens need. Implemented by the HTTP client and by the offline demo. */
export interface ExpenseApi {
  readonly mode: 'live' | 'demo';
  login(email: string, password: string): Promise<AuthResponse>;
  register(fullName: string, email: string, password: string): Promise<AuthResponse>;
  categories(): Promise<Category[]>;
  createCategory(name: string): Promise<Category>;
  expenses(page: number, size?: number): Promise<Page<Expense>>;
  createExpense(input: ExpenseInput): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;
  monthlyReport(year: number, month: number): Promise<MonthlyReport>;
}
