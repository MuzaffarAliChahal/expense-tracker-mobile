import { validateCredentials, validateExpense } from '../src/utils/validation';

const today = '2026-10-05';

describe('validateExpense', () => {
  it('accepts a valid expense', () => {
    expect(validateExpense({ amount: '25.50', description: 'Lunch', spentOn: '2026-10-01' }, today)).toEqual({});
  });

  it('rejects zero, too many decimals and future dates', () => {
    expect(validateExpense({ amount: '0', description: '', spentOn: today }, today).amount).toBeDefined();
    expect(validateExpense({ amount: '1.234', description: '', spentOn: today }, today).amount).toBe('Use at most 2 decimal places');
    expect(validateExpense({ amount: '5', description: '', spentOn: '2026-10-06' }, today).spentOn).toBe('Date cannot be in the future');
    expect(validateExpense({ amount: '5', description: '', spentOn: '05/10/2026' }, today).spentOn).toBe('Use the format YYYY-MM-DD');
  });

  it('accepts a comma decimal separator', () => {
    expect(validateExpense({ amount: '12,5', description: '', spentOn: today }, today)).toEqual({});
  });
});

describe('validateCredentials', () => {
  it('checks email, password length and name on register', () => {
    expect(validateCredentials('bad', 'short', '')).toEqual({
      fullName: 'Enter your name',
      email: 'Enter a valid email',
      password: 'Password must be at least 8 characters',
    });
    expect(validateCredentials('ali@example.com', 'Str0ngPassw0rd!')).toEqual({});
  });
});
