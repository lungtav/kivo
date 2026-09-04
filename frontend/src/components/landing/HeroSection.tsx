import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <section className="w-full bg-white">
      <main className="mx-auto max-w-5xl px-6 pt-40 pb-20 text-center">
        <h1 className="mx-auto max-w-2xl text-5xl font-bold tracking-tight text-neutral-950 sm:text-6xl">
          Space for your team, friends and communities
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-neutral-500">
          Create a space, organize channels, and talk in realtime — invites, direct messages, and everything in between.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            to="/register"
            className="rounded-xl bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
          >
            Get started
          </Link>
        </div>

        <div className="mt-16 overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left shadow-sm">
          <div className="flex items-center space-x-3 border-b border-neutral-100 bg-neutral-50/60 px-4 py-3">
            <div className="flex items-center space-x-2">
              <div className="size-2.5 rounded-full bg-neutral-300" />
              <div className="size-2.5 rounded-full bg-neutral-300" />
              <div className="size-2.5 rounded-full bg-neutral-300" />
            </div>
            <div className="flex flex-1 items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-500">
              <span className="truncate">kivo.app/space/design-team</span>
              <span className="flex items-center gap-1.5 text-[10px] text-neutral-400"><span className="size-1.5 rounded-full bg-neutral-900" />Live</span>
            </div>
          </div>
          <div className="space-y-5 p-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-400">#</span>
                <span className="text-sm font-semibold text-neutral-950">design-team</span>
                <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] font-semibold text-white">3 unread</span>
              </div>
              <div className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs text-neutral-400">⌘K Search</div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-500">JD</div>
              <div>
                <div className="flex items-center space-x-2"><span className="text-sm font-semibold text-neutral-950">Jordan D.</span><span className="text-xs text-neutral-400">11:05 AM</span></div>
                <p className="mt-1 max-w-xl text-sm text-neutral-700">Pushed the new signup flow — feedback belongs in here now.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-500">A</div>
              <div>
                <div className="flex items-center space-x-2"><span className="text-sm font-semibold text-neutral-950">Ada</span><span className="text-xs text-neutral-400">11:07 AM</span></div>
                <div className="mt-1 max-w-xl rounded-lg border-l-2 border-neutral-300 bg-neutral-50 px-2.5 py-1 text-[11px] text-neutral-500"><span className="font-semibold text-neutral-700">Jordan D.</span> Pushed the new signup flow…</div>
                <p className="mt-1 max-w-xl text-sm text-neutral-700">Love it. Left two comments on the empty states.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-12 text-xs text-neutral-400">
              <span className="flex -space-x-1.5">
                <span className="grid size-5 place-items-center rounded-full bg-neutral-100 text-[8px] font-bold text-neutral-600 ring-2 ring-white">M</span>
                <span className="grid size-5 place-items-center rounded-full bg-neutral-100 text-[8px] font-bold text-neutral-600 ring-2 ring-white">T</span>
              </span>
              Maya and Tola are typing…
            </div>
          </div>
        </div>
      </main>
    </section>
  );
}
