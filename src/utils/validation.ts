export interface ExpenseForm {
  amount: string;
  description: string;
  spentOn: string;
}

/** Mirrors the server's Bean Validation rules so users see errors before submitting. */
export function validateExpense(f: ExpenseForm, today: string): Record<string, string> {
  const errors: Record<string, string> = {};
  const amount = Number(f.amount.replace(',', '.'));
  if (!f.amount.trim() || Number.isNaN(amount) || amount < 0.01) errors.amount = 'Enter an amount of at least 0.01';
  else if (!/^\d{1,10}([.,]\d{1,2})?$/.test(f.amount.trim())) errors.amount = 'Use at most 2 decimal places';
  if (f.description.length > 255) errors.description = 'Keep the description under 255 characters';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.spentOn) || Number.isNaN(Date.parse(f.spentOn))) errors.spentOn = 'Use the format YYYY-MM-DD';
  else if (f.spentOn > today) errors.spentOn = 'Date cannot be in the future';
  return errors;
}

export function validateCredentials(email: string, password: string, fullName?: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (fullName !== undefined && !fullName.trim()) errors.fullName = 'Enter your name';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Enter a valid email';
  if (password.length < 8) errors.password = 'Password must be at least 8 characters';
  return errors;
}
