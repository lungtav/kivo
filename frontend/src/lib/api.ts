const apiBaseUrl = import.meta.env.VITE_API_URL ?? "";
const requestTimeoutMs = 10_000;

type ApiErrorResponse = {
  error?: { code?: string; message?: string };
};

export class ApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, timeoutMs = requestTimeoutMs): Promise<T> {
  let response: Response;
  const controller = timeoutMs ? new AbortController() : undefined;
  const timeoutId = timeoutMs ? window.setTimeout(() => controller?.abort(), timeoutMs) : undefined;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init.headers },
      signal: controller?.signal,
    });
  } catch {
    throw new ApiError("Kivo did not respond. Check that the backend is running, then try again.");
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
  const payload = await response.json().catch(() => null) as T | ApiErrorResponse | null;

  if (!response.ok) {
    const error = (payload as ApiErrorResponse | null)?.error;
    const message = error?.message ?? `Something went wrong (error ${response.status}). Please try again.`;
    throw new ApiError(message, error?.code);
  }

  return payload as T;
}
