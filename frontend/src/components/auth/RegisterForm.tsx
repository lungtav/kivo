import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Brand } from "../brand/Brand";
import { AuthField } from "./AuthField";
import { register } from "../../lib/auth";

const initialForm = { email: "", display_name: "", username: "", password: "" };
type FormValues = typeof initialForm;

export function RegisterForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormValues>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof FormValues) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const validate = () => {
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Enter a valid email address.";
    if (!form.display_name.trim()) return "Enter the name people should call you.";
    if (form.username.trim().length < 3) return "Your username must be at least 3 characters.";
    if (form.password.length < 8) return "Your password must be at least 8 characters.";
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }
    try {
      await register(form);
      sessionStorage.setItem("kivo_pending_verification_email", form.email);
      navigate("/check-email", { state: { email: form.email } });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "We couldn't create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Brand />
      <div className="mt-8">
        <p className="text-sm font-medium text-neutral-600">Get started for free</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.045em] text-black">Create your Kivo account</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-500">One account, all the spaces you belong to.</p>
      </div>
      <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-3.5">
        <AuthField id="email" label="Email address" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={updateField("email")} required />
        <div className="grid gap-5 sm:grid-cols-2">
          <AuthField id="display_name" label="Display name" autoComplete="name" placeholder="Ada Lovelace" value={form.display_name} onChange={updateField("display_name")} required />
          <AuthField id="username" label="Username" autoComplete="username" placeholder="ada" minLength={3} value={form.username} onChange={updateField("username")} required />
        </div>
        <AuthField id="password" label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} value={form.password} onChange={updateField("password")} required />
        {error && <p role="alert" aria-live="assertive" className="rounded-xl border border-black bg-neutral-100 px-4 py-3 text-sm text-black">{error}</p>}
        <button type="submit" disabled={loading} className="group relative mt-2 flex w-full items-center justify-center overflow-hidden rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,.18)] transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60">
          <span className="relative z-10">{loading ? "Creating your account…" : "Create account"}</span>
          <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </button>
      </form>
      <p className="mt-5 text-sm text-neutral-500">Already have an account? <Link to="/login" className="font-semibold text-black underline underline-offset-4">Log in</Link></p>
    </div>
  );
}
