import { apiRequest } from "./api";

export type RegisterInput = {
  email: string;
  display_name: string;
  username: string;
  password: string;
};

type LoginResponse = {
  accessToken: string;
};

export const register = (input: RegisterInput) => apiRequest("/api/auth/register", { method: "POST", body: JSON.stringify(input) });

export const login = (input: Pick<RegisterInput, "email" | "password">) => apiRequest<LoginResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(input) });

export const verifyEmail = (token: string) => apiRequest<{ message: string }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, { method: "POST" }, 0);

export const resendVerification = (input: { email?: string; token?: string }) => apiRequest<{ message: string }>("/api/auth/resend-verification", { method: "POST", body: JSON.stringify(input) });

export const logout = () => apiRequest<{ message: string }>("/api/auth/logout", { method: "POST" });
