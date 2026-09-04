import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="w-full bg-white">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-neutral-950 px-8 py-20 text-center">
          {/* inverted backdrop: glow, fading grid, rings */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_20rem_at_50%_-25%,rgba(255,255,255,0.16),transparent)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.07)_1px,transparent_1px)] bg-size-[32px_32px] [mask-image:radial-gradient(42rem_26rem_at_50%_0%,black,transparent)]" />
          <div className="pointer-events-none absolute -left-28 -bottom-44 size-80 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -left-12 -bottom-32 size-80 rounded-full border border-white/[.05]" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready when your people are</h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-neutral-400">
              Create a space, drop in a channel, and start talking.
            </p>
            <Link
              to="/register"
              className="mt-8 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-semibold text-neutral-950 transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-200"
            >
              Create your space
            </Link>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8 text-sm text-neutral-400">
        <p>© {new Date().getFullYear()} Kivo — a place to work together.</p>
        <div className="flex items-center gap-6">
          <Link to="/login" className="transition-colors hover:text-neutral-900">Log in</Link>
          <Link to="/register" className="font-medium text-neutral-900 transition-colors hover:text-neutral-500">Sign up</Link>
        </div>
      </div>
    </footer>
  );
}
