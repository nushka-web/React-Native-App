export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export async function requestAccountDeletion(
  email: string,
  password: string,
): Promise<{ success: boolean; message?: string }> {
  const response = await fetch(
    `${API_BASE_URL}/api/account-deletion/request`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data?.message ||
      (response.status === 401
        ? 'The email or password you entered is incorrect.'
        : response.status === 429
          ? 'Too many requests. Please wait a few minutes and try again.'
          : response.status >= 500
            ? 'The server encountered an error. Please try again later.'
            : 'Something went wrong. Please try again.');
    throw new ApiError(message, response.status);
  }

  return data;
}
