import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthField } from "./AuthField";
import { Brand } from "../brand/Brand";
import { login } from "../../lib/auth";
import { ApiError } from "../../lib/api";

const initialForm = { email: "", password: "" };

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const updateField =
    (field: keyof typeof initialForm) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const validate = () => {
    if (!/^\S+@\S+\.\S+$/.test(form.email))
      return "Enter a valid email address.";
    if (!form.password) return "Enter your password.";
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }
    try {
      const { accessToken } = await login(form);
      localStorage.setItem("kivo_access_token", accessToken);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from && from.startsWith("/") ? from : "/app");
    } catch (submissionError) {
      if (submissionError instanceof ApiError && submissionError.code === "EMAIL_UNVERIFIED") {
        sessionStorage.setItem("kivo_pending_verification_email", form.email);
        navigate("/verify-account", { state: { email: form.email } });
        return;
      }
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "We couldn't log you in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Brand />
      <div className="mt-8">
        <p className="text-sm font-medium text-neutral-600">Welcome back</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.045em] text-black">
          Log in to Kivo
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Pick up where your conversations left off.
        </p>
      </div>
      <form noValidate onSubmit={handleSubmit} className="mt-7 space-y-4">
        <AuthField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={updateField("email")}
          required
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={form.password}
          onChange={updateField("password")}
          required
        />
        {error && (
          <p
            role="alert"
            aria-live="assertive"
            className="rounded-xl border border-black bg-neutral-100 px-4 py-3 text-sm text-black"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="group relative mt-2 flex w-full items-center justify-center overflow-hidden rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,.18)] transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
        >
          <span className="relative z-10">
            {loading ? "Logging in…" : "Log in"}
          </span>
          <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </button>
      </form>
      <p className="mt-5 text-sm text-neutral-500">
        New to Kivo?{" "}
        <Link
          to="/register"
          className="font-semibold text-black underline underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
