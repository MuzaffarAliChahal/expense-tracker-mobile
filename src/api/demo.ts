import { ApiError } from './client';
import type { Category, Expense, ExpenseApi, MonthlyReport } from './types';

/**
 * Offline stand-in for the backend, so the app can be tried in Expo Go without running the API.
 * Same rules as the server: per-user data, unique category names, newest expenses first.
 */
export function createDemoApi(seed = true): ExpenseApi {
  let categories: Category[] = [];
  let expenses: Expense[] = [];
  let nextId = 1;

  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const daysAgo = (n: number) => iso(new Date(Date.now() - n * 86_400_000));

  if (seed) {
    categories = [
      { id: nextId++, name: 'Food' },
      { id: nextId++, name: 'Transport' },
      { id: nextId++, name: 'Bills' },
    ];
    const sample: [number, string, number, number][] = [
      [12.5, 'Lunch', 1, 0], [6.2, 'Metro card top-up', 2, 1], [48.0, 'Electricity', 3, 3],
      [21.75, 'Groceries', 1, 5], [9.4, 'Coffee with team', 1, 8],
    ];
    expenses = sample.map(([amount, description, categoryId, ago]) => ({
      id: nextId++, amount, description, spentOn: daysAgo(ago), categoryId,
      categoryName: categories.find((c) => c.id === categoryId)!.name,
    }));
  }

  const token = { accessToken: 'demo-token', tokenType: 'Bearer', expiresInSeconds: 3600 };
  const sorted = () => [...expenses].sort((a, b) => b.spentOn.localeCompare(a.spentOn) || b.id - a.id);

  return {
    mode: 'demo',
    login: async (email, password) => {
      if (!email || password.length < 8) throw new ApiError('Invalid email or password', 401);
      return token;
    },
    register: async (_name, email, password) => {
      if (!email || password.length < 8) throw new ApiError('Validation failed', 400, { password: 'size must be between 8 and 72' });
      return token;
    },
    categories: async () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    createCategory: async (name) => {
      if (categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
        throw new ApiError(`Category '${name.trim()}' already exists`, 409);
      }
      const c = { id: nextId++, name: name.trim() };
      categories.push(c);
      return c;
    },
    expenses: async (page, size = 20) => {
      const all = sorted();
      return {
        content: all.slice(page * size, page * size + size),
        page, size,
        totalElements: all.length,
        totalPages: Math.ceil(all.length / size),
      };
    },
    createExpense: async (input) => {
      const cat = categories.find((c) => c.id === input.categoryId) ?? null;
      const e: Expense = {
        id: nextId++, amount: input.amount, description: input.description ?? null, spentOn: input.spentOn,
        categoryId: cat?.id ?? null, categoryName: cat?.name ?? null,
      };
      expenses.push(e);
      return e;
    },
    deleteExpense: async (id) => {
      if (!expenses.some((e) => e.id === id)) throw new ApiError('Expense not found', 404);
      expenses = expenses.filter((e) => e.id !== id);
    },
    monthlyReport: async (year, month) => {
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      const inMonth = expenses.filter((e) => e.spentOn.startsWith(prefix));
      const groups = new Map<string | null, { total: number; count: number }>();
      for (const e of inMonth) {
        const g = groups.get(e.categoryName) ?? { total: 0, count: 0 };
        groups.set(e.categoryName, { total: g.total + e.amount, count: g.count + 1 });
      }
      const report: MonthlyReport = {
        year, month,
        total: round2(inMonth.reduce((s, e) => s + e.amount, 0)),
        count: inMonth.length,
        byCategory: [...groups.entries()]
          .map(([category, g]) => ({ category, total: round2(g.total), count: g.count }))
          .sort((a, b) => b.total - a.total),
      };
      return report;
    },
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;
