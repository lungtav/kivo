import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="w-full bg-white">
      <div className="mx-auto max-w-5xl px-6">
        <div className="rounded-3xl bg-neutral-950 px-8 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready when your people are</h2>
          <p className="mx-auto mt-3 max-w-md text-base leading-7 text-neutral-400">
            Create a space, drop in a channel, and start talking.
          </p>
          <Link
            to="/register"
            className="mt-8 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-semibold text-neutral-950 transition-colors hover:bg-neutral-200"
          >
            Create your space
          </Link>
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
