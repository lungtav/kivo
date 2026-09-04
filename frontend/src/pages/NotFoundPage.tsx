import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return <main className="grid min-h-svh place-items-center bg-background px-6 text-foreground">
    <section className="max-w-md text-center">
      <p className="text-sm font-semibold uppercase tracking-[.2em] text-stone-500">Error 404</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">This page doesn’t exist.</h1>
      <p className="mt-4 text-sm leading-6 text-stone-400">The link may be out of date, or the page may have moved.</p>
      <Link to="/" className="mt-7 inline-flex rounded-xl bg-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-900 transition hover:bg-white">Go to home</Link>
    </section>
  </main>;
}
