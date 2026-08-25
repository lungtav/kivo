import { CircleCheck, CircleX, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { Brand } from "../components/brand/Brand";
import { verifyEmail } from "../lib/auth";
import { ResendVerification } from "../components/auth/ResendVerification";

type VerificationState = "checking" | "success" | "error";
const verificationAttempts = new Map<string, Promise<void>>();

function verifyOnce(token: string) {
  const previousAttempt = verificationAttempts.get(token);
  if (previousAttempt) return previousAttempt;
  const attempt = verifyEmail(token).then(() => undefined);
  verificationAttempts.set(token, attempt);
  return attempt;
}

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<VerificationState>(token ? "checking" : "error");
  const [error, setError] = useState(token ? "" : "This verification link is missing its token.");
  const email = sessionStorage.getItem("kivo_pending_verification_email") ?? undefined;

  useEffect(() => {
    if (!token) return;
    let active = true;
    verifyOnce(token)
      .then(() => { if (active) setStatus("success"); })
      .catch((verificationError) => {
        if (active) {
          setStatus("error");
          setError(verificationError instanceof Error ? verificationError.message : "We couldn't verify this email address.");
        }
      });
    return () => { active = false; };
  }, [token]);

  const content = status === "checking"
    ? { icon: <LoaderCircle className="animate-spin" size={24} />, eyebrow: "Verifying your email", title: "Just a moment", body: "We’re confirming your email address and activating your Kivo account." }
    : status === "success"
      ? { icon: <CircleCheck size={24} />, eyebrow: "Email verified", title: "You’re all set", body: "Your Kivo account is active. Log in to enter your space." }
      : { icon: <CircleX size={24} />, eyebrow: "We couldn’t verify this email", title: "This link didn’t work", body: error || "The link may be invalid or expired. Request a new verification email and try again." };

  return (
    <AuthLayout>
      <Brand />
      <div className="mt-14">
        <div className={`flex size-12 items-center justify-center rounded-2xl ${status === "success" ? "bg-black text-white" : "border border-black bg-white text-black"}`}>{content.icon}</div>
        <p className="mt-8 text-sm font-medium text-neutral-600">{content.eyebrow}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-.045em] text-black">{content.title}</h1>
        <p role={status === "error" ? "alert" : undefined} aria-live="polite" className="mt-4 max-w-sm text-sm leading-6 text-neutral-500">{content.body}</p>
        {status === "error" && <ResendVerification email={email} token={token ?? undefined} />}
        {status !== "checking" && <Link to={status === "success" ? "/login" : "/register"} className="mt-8 inline-flex rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">{status === "success" ? "Log in to Kivo" : "Create an account"}</Link>}
      </div>
    </AuthLayout>
  );
}
