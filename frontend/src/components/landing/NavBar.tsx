import { useState } from "react";
import { Link } from "react-router-dom";
import kivoLogo from "../../assets/kivo-logo.jfif";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <nav className="mx-auto max-w-7xl rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-[0_8px_30px_rgb(15,23,42,0.06)] backdrop-blur-xl sm:px-5">
        <div className="flex h-12 items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="group flex items-center shrink-0"
            aria-label="Kivo home"
          >
            <img
              src={kivoLogo}
              alt="Kivo"
              className="h-9 w-9 object-contain transition-transform duration-300 group-hover:scale-105"
            />

            <span className="ml-2.5 text-xl font-bold tracking-[-0.04em] text-[#0B1020]">
              kivo
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <a href="#features" className="rounded-lg px-4 py-2 text-sm font-medium transition-all hover:bg-violet-50">Features</a>
            <a href="#communities" className="rounded-lg px-4 py-2 text-sm font-medium transition-all hover:bg-violet-50">Communities</a>
            <a href="#about" className="rounded-lg px-4 py-2 text-sm font-medium transition-all hover:bg-violet-50">About</a>
            <a href="#github" className="rounded-lg px-4 py-2 text-sm font-medium transition-all hover:bg-violet-50">GitHub</a>
          </div>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 md:flex">
            <Link
              to="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              Log in
            </Link>

            <Link
              to="/register"
              className="group relative overflow-hidden rounded-xl bg-[#0B1020] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(91,53,213,0.28)] transition-all duration-300 hover:-translate-y-0.5"
            >
              <span className="relative z-10">Join Kivo</span>

              <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-[#7C4DFF] md:hidden"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>}</svg>
          </button>
        </div>

        {menuOpen && (
          <div className="mt-2 flex flex-col gap-1 border-t border-slate-200/80 pt-2 md:hidden">
            <Link to="/login" onClick={() => setMenuOpen(false)} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-violet-50">Log in</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} className="rounded-lg bg-[#0B1020] px-4 py-2.5 text-center text-sm font-semibold text-white">Join Kivo</Link>
          </div>
        )}
      </nav>
    </header>
  );
}
