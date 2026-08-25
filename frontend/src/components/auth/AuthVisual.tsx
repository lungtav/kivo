import { WorkspacePreview } from "../app/WorkspacePreview";
import { Brand } from "../brand/Brand";

export function AuthVisual() {
  return (
    <div className="relative h-full overflow-hidden bg-black p-8 text-white xl:p-12">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-size-[28px_28px]" />
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
