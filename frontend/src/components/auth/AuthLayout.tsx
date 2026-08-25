import type { ReactNode } from "react";
import { AuthVisual } from "./AuthVisual";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-svh bg-white lg:h-svh lg:min-h-0 lg:overflow-hidden lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,.95fr)]">
      <aside className="hidden lg:block"><AuthVisual /></aside>
      <section className="flex min-h-svh items-center justify-center px-6 py-8 sm:px-10 lg:min-h-0 lg:overflow-y-auto lg:px-16">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
