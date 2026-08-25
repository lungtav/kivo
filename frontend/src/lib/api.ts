const apiBaseUrl = import.meta.env.VITE_API_URL ?? "";
const requestTimeoutMs = 10_000;

type ApiErrorResponse = {
  error?: { message?: string };
};

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init.headers },
      signal: controller.signal,
    });
  } catch {
    throw new ApiError("Kivo did not respond. Check that the backend is running, then try again.");
  } finally {
    window.clearTimeout(timeoutId);
  }
  const payload = await response.json().catch(() => null) as T | ApiErrorResponse | null;

  if (!response.ok) {
    const message = (payload as ApiErrorResponse | null)?.error?.message ?? `Something went wrong (error ${response.status}). Please try again.`;
    throw new ApiError(message);
  }

  return payload as T;
}
