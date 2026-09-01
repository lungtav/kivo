const apiBaseUrl = import.meta.env.VITE_API_URL ?? "";
const requestTimeoutMs = 10_000;
let refreshPromise: Promise<string | null> | null = null;

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

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${apiBaseUrl}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = await response.json() as { accessToken?: string };
        if (!payload.accessToken) return null;
        localStorage.setItem("kivo_access_token", payload.accessToken);
        return payload.accessToken;
      })
      .catch(() => null)
      .finally(() => { refreshPromise = null; });
  }
  const token = await refreshPromise;
  if (!token) localStorage.removeItem("kivo_access_token");
  return token;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, timeoutMs = requestTimeoutMs, retryAfterRefresh = true): Promise<T> {
  let response: Response;
  const controller = timeoutMs ? new AbortController() : undefined;
  const timeoutId = timeoutMs ? window.setTimeout(() => controller?.abort(), timeoutMs) : undefined;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(localStorage.getItem("kivo_access_token")
          ? { Authorization: `Bearer ${localStorage.getItem("kivo_access_token")}` }
          : {}),
        ...init.headers,
      },
      signal: controller?.signal,
    });
  } catch {
    throw new ApiError("Kivo did not respond. Check that the backend is running, then try again.");
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
  const payload = await response.json().catch(() => null) as T | ApiErrorResponse | null;

  if (!response.ok) {
    if (response.status === 401 && retryAfterRefresh && !path.startsWith("/api/auth/")) {
      const token = await refreshAccessToken();
      if (token) return apiRequest<T>(path, init, timeoutMs, false);
    }
    const error = (payload as ApiErrorResponse | null)?.error;
    const message = error?.message ?? `Something went wrong (error ${response.status}). Please try again.`;
    throw new ApiError(message, error?.code);
  }

  return payload as T;
}
