import { ApiError, createHttpApi } from '../src/api/client';

const json = (status: number, body: unknown) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response);

describe('createHttpApi', () => {
  const fetchMock = jest.fn();
  beforeEach(() => { fetchMock.mockReset(); globalThis.fetch = fetchMock as unknown as typeof fetch; });

  it('sends the bearer token and paging parameters', async () => {
    fetchMock.mockReturnValue(json(200, { content: [], page: 1, size: 10, totalElements: 0, totalPages: 0 }));
    const api = createHttpApi('http://api.local/', () => 'jwt-123');
    await api.expenses(1, 10);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.local/api/expenses?page=1&size=10');
    expect(init.headers.Authorization).toBe('Bearer jwt-123');
  });

  it('maps RFC 7807 errors to ApiError with field errors', async () => {
    fetchMock.mockReturnValue(json(400, { title: 'Bad Request', detail: 'Validation failed', errors: { amount: 'must be greater than or equal to 0.01' } }));
    const api = createHttpApi('http://api.local', () => 'jwt');
    await expect(api.createExpense({ amount: 0, spentOn: '2026-10-01' })).rejects.toMatchObject({
      status: 400, message: 'Validation failed', fieldErrors: { amount: 'must be greater than or equal to 0.01' },
    });
  });

  it('signs the user out on 401 with an expired token', async () => {
    fetchMock.mockReturnValue(json(401, {}));
    const onUnauthorized = jest.fn();
    const api = createHttpApi('http://api.local', () => 'expired', onUnauthorized);
    await expect(api.categories()).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalled();
  });

  it('handles 204 No Content on delete', async () => {
    fetchMock.mockReturnValue(Promise.resolve({ ok: true, status: 204, json: () => Promise.reject(new Error('no body')) } as Response));
    const api = createHttpApi('http://api.local', () => 'jwt');
    await expect(api.deleteExpense(7)).resolves.toBeUndefined();
  });
});
