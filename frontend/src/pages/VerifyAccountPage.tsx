import { Mail } from "lucide-react";
import { useLocation } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { ResendVerification } from "../components/auth/ResendVerification";
import { Brand } from "../components/brand/Brand";

export default function VerifyAccountPage() {
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? sessionStorage.getItem("kivo_pending_verification_email") ?? undefined;

  return (
    <AuthLayout>
      <Brand />
      <div className="mt-14">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-black text-white"><Mail size={24} /></div>
        <p className="mt-8 text-sm font-medium text-neutral-600">Email verification needed</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-.045em] text-black">Verify your inbox first</h1>
        <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-500">Your account is ready, but we need to confirm your email before you can log in. Send a fresh verification link whenever you’re ready.</p>
        <ResendVerification email={email} />
      </div>
    </AuthLayout>
  );
}
