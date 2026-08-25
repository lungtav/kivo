import { useState, type FormEvent } from "react";
import { resendVerification } from "../../lib/auth";

type ResendVerificationProps = {
  email?: string;
  token?: string;
};

export function ResendVerification({ email: initialEmail = "", token }: ResendVerificationProps) {
  const [email, setEmail] = useState(initialEmail);
  const [showEmailField, setShowEmailField] = useState(!initialEmail && !token);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!token && !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter the email address you used to sign up.");
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      await resendVerification(token ? { token } : { email });
      setStatus("sent");
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "We couldn't resend the verification email.");
      setStatus("idle");
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void send();
  };

  if (status === "sent") return <p aria-live="polite" className="mt-6 text-sm leading-6 text-neutral-600">A new verification link is on its way{email ? <> to <span className="font-semibold text-black">{email}</span></> : ""}.</p>;

  return (
    <div className="mt-6">
      {showEmailField ? <form noValidate onSubmit={submit} className="space-y-3"><label className="block text-xs font-semibold uppercase tracking-[.14em] text-neutral-500" htmlFor="resend-email">Email address</label><div className="flex gap-2"><input id="resend-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="min-w-0 flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-4 focus:ring-neutral-200" /><button type="submit" disabled={status === "sending"} className="shrink-0 rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">{status === "sending" ? "Sending…" : "Resend"}</button></div>{error && <p role="alert" className="text-sm text-black">{error}</p>}</form> : <button type="button" onClick={() => void send()} disabled={status === "sending"} className="text-sm font-semibold text-black underline underline-offset-4 disabled:opacity-60">{status === "sending" ? "Sending verification email…" : "Resend verification email"}</button>}
      {!showEmailField && error && <p role="alert" className="mt-2 text-sm text-black">{error}</p>}
      {!showEmailField && <button type="button" onClick={() => setShowEmailField(true)} className="ml-4 text-sm text-neutral-500 underline underline-offset-4">Use another email</button>}
    </div>
  );
}
