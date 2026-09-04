import { WorkspacePreview } from "../app/WorkspacePreview";
import { Brand } from "../brand/Brand";

export function AuthVisual() {
  return (
    <div className="relative h-full overflow-hidden bg-black p-8 text-white xl:p-12">
      {/* layered monochrome glow */}
      <div className="absolute inset-0 bg-[radial-gradient(60rem_40rem_at_115%_-10%,rgba(255,255,255,0.10),transparent),radial-gradient(46rem_34rem_at_-15%_110%,rgba(255,255,255,0.07),transparent)]" />
      {/* grid, faded out toward the edges */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] bg-size-[32px_32px] [mask-image:radial-gradient(65rem_48rem_at_70%_25%,black,transparent)]" />
      {/* concentric rings */}
      <div className="pointer-events-none absolute -right-28 top-1/4 size-80 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-12 top-1/3 size-80 rounded-full border border-white/[.06]" />
      <div className="pointer-events-none absolute -right-4 top-[42%] size-80 rounded-full border border-white/[.03]" />
      <div className="relative flex h-full flex-col">
        <Brand light />
        <div className="my-auto w-full max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">A place to work together</p>
          <h2 className="mt-4 max-w-lg text-3xl font-semibold tracking-[-0.04em] xl:text-4xl">Less noise. More room for the conversation.</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/55">Kivo keeps your team’s channels, messages, and decisions in one calm space.</p>
          <div className="mt-8"><WorkspacePreview /></div>
        </div>
        <p className="text-xs text-white/35">Built for teams, friends, and communities.</p>
      </div>
    </div>
  );
}
