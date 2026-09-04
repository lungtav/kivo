import { useState } from "react";
import { Link } from "react-router-dom";
import kivoLogo from "../../assets/kivo-logo.jfif";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <nav className="mx-auto max-w-6xl rounded-2xl border border-neutral-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur sm:px-5">
        <div className="flex h-10 items-center justify-between">
          <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Kivo home">
            <img src={kivoLogo} alt="Kivo" className="h-8 w-8 rounded-lg object-contain grayscale" />
            <span className="text-lg font-bold tracking-tight text-neutral-950">kivo</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-neutral-500 transition-colors hover:text-neutral-950">Features</a>
          </div>

          <div className="hidden items-center gap-5 md:flex">
            <Link to="/login" className="text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-950">Log in</Link>
            <Link to="/register" className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-700">Get started</Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition-colors hover:text-neutral-950 md:hidden"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>}</svg>
          </button>
        </div>

        {menuOpen && (
          <div className="mt-2 flex flex-col gap-1 border-t border-neutral-200 pt-2 md:hidden">
            <a href="#features" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50">Features</a>
            <Link to="/login" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50">Log in</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} className="rounded-lg bg-neutral-950 px-3 py-2.5 text-center text-sm font-semibold text-white">Get started</Link>
          </div>
        )}
      </nav>
    </header>
  );
}
