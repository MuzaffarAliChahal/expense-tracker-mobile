import { createDemoApi } from '../src/api/demo';
import { shiftMonth } from '../src/screens/ReportScreen';

describe('demo api', () => {
  it('pages expenses newest first and builds a monthly report', async () => {
    const api = createDemoApi(false);
    const food = await api.createCategory('Food');
    await api.createExpense({ amount: 10, spentOn: '2026-09-02', categoryId: food.id, description: 'Lunch' });
    await api.createExpense({ amount: 5.25, spentOn: '2026-09-20', categoryId: food.id });
    await api.createExpense({ amount: 30, spentOn: '2026-09-15' });
    await api.createExpense({ amount: 99, spentOn: '2026-08-31' });

    const page = await api.expenses(0, 2);
    expect(page.totalElements).toBe(4);
    expect(page.totalPages).toBe(2);
    expect(page.content.map((e) => e.spentOn)).toEqual(['2026-09-20', '2026-09-15']);

    const report = await api.monthlyReport(2026, 9);
    expect(report.total).toBe(45.25);
    expect(report.count).toBe(3);
    expect(report.byCategory).toEqual([
      { category: null, total: 30, count: 1 },
      { category: 'Food', total: 15.25, count: 2 },
    ]);
  });

  it('rejects duplicate category names', async () => {
    const api = createDemoApi(false);
    await api.createCategory('Bills');
    await expect(api.createCategory(' bills ')).rejects.toMatchObject({ status: 409 });
  });
});

describe('shiftMonth', () => {
  it('wraps across years', () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });
});
