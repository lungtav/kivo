import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer id="about" className="scroll-mt-28 w-full bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#0B1020] px-8 py-16 text-center text-white">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-violet-600/25 blur-3xl" />
          <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">Ready when your people are</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-base leading-7 text-slate-400">
            Create a space, drop in a channel, and start talking — it takes less than a minute.
          </p>
          <Link
            to="/register"
            className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0B1020] shadow-[0_8px_30px_rgba(139,92,246,0.35)] transition-all duration-300 hover:-translate-y-0.5"
          >
            Create your space
          </Link>
        </div>
      </div>
      <div id="github" className="scroll-mt-28 mt-16 border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} Kivo — a place to work together.</p>
          <nav className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#communities" className="hover:text-slate-900">Messages</a>
            <Link to="/login" className="hover:text-slate-900">Log in</Link>
            <Link to="/register" className="font-semibold text-slate-900 hover:text-violet-600">Sign up</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
