import { useLocation } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { AuthLayout } from "../components/auth/AuthLayout";
import { Brand } from "../components/brand/Brand";
import { ResendVerification } from "../components/auth/ResendVerification";

export default function CheckEmailPage() {
  const { state } = useLocation() as { state?: { email?: string } };
  const email = state?.email ?? sessionStorage.getItem("kivo_pending_verification_email") ?? undefined;
  return <AuthLayout><Brand /><div className="mt-14"><div className="flex size-12 items-center justify-center rounded-2xl bg-black text-white"><MailCheck size={24} /></div><p className="mt-8 text-sm font-medium text-neutral-600">Almost there</p><h1 className="mt-2 text-4xl font-bold tracking-[-.045em] text-black">Check your inbox</h1><p className="mt-4 max-w-sm text-sm leading-6 text-neutral-500">We sent a verification link{email ? ` to ${email}` : " to your email address"}. Open it to activate your Kivo account.</p><ResendVerification email={email} /></div></AuthLayout>;
}
