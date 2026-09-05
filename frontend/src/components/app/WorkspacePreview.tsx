import { AtSign } from "lucide-react";

export function WorkspacePreview() {
  return (
    <div className="flex h-64 overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left shadow-2xl shadow-black/40">
      {/* space rail */}
      <div className="flex w-10 shrink-0 flex-col items-center gap-1.5 border-r border-neutral-200 bg-neutral-100 py-2.5">
        <span className="grid size-7 place-items-center rounded-lg bg-neutral-950 text-[8px] font-bold text-white">
          TT
        </span>
        <span className="grid size-7 place-items-center rounded-lg border border-neutral-200 bg-white text-[8px] font-bold text-neutral-400">
          +
        </span>
        <span className="mt-auto grid size-7 place-items-center rounded-lg text-[9px] text-neutral-400">
          ⚙
        </span>
      </div>
      {/* channels + dms */}
      <div className="w-32 shrink-0 border-r border-neutral-200 bg-neutral-50 p-2.5">
        <p className="px-1 text-[8px] font-bold uppercase tracking-[.14em] text-neutral-400">
          Space
        </p>
        <p className="truncate px-1 text-[10px] font-semibold text-neutral-900">
          Design team
        </p>
        <div className="mt-2 space-y-0.5">
          <p className="flex items-center gap-1.5 rounded-md bg-neutral-950 px-1.5 py-1 text-[9px] font-medium text-white">
            <AtSign size={8} /> general
          </p>
          <p className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[9px] text-neutral-500">
            <AtSign size={8} /> design{" "}
            <span className="ml-auto grid h-3 min-w-3 place-items-center rounded-full bg-neutral-950 px-1 text-[7px] font-bold text-white">
              3
            </span>
          </p>
          <p className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[9px] text-neutral-500">
            <AtSign size={8} /> shipping
          </p>
        </div>
        
      </div>
      {/* thread */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
          <p className="flex items-center gap-1 text-[10px] font-semibold text-neutral-900">
            <AtSign size={9} className="text-neutral-400" /> general
          </p>
          <span className="flex items-center gap-1 text-[8px] text-neutral-400">
            <span className="size-1 rounded-full bg-neutral-900" />
            Live
          </span>
        </div>
        <div className="flex-1 space-y-2.5 p-3">
          <div className="flex gap-1.5">
            <span className="grid size-5 shrink-0 place-items-center rounded-lg border border-neutral-200 bg-neutral-50 text-[7px] font-bold text-neutral-500">
              JD
            </span>
            <p className="min-w-0 text-[9px] leading-[1.35] text-neutral-700">
              <strong className="mr-1 text-neutral-950">Jordan D.</strong>The
              new signup flow is ready for review.
            </p>
          </div>
          <div className="flex gap-1.5">
            <span className="grid size-5 shrink-0 place-items-center rounded-lg border border-neutral-200 bg-neutral-50 text-[7px] font-bold text-neutral-500">
              A
            </span>
            <div className="min-w-0">
              <div className="max-w-[180px] rounded border-l-2 border-neutral-300 bg-neutral-50 px-1.5 py-0.5 text-[8px] text-neutral-500">
                <strong className="text-neutral-700">Jordan D.</strong> The new
                signup flow…
              </div>
              <p className="mt-0.5 text-[9px] leading-[1.35] text-neutral-700">
                <strong className="mr-1 text-neutral-950">Ada</strong>Nice. I'll
                share it with the rest of the team.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 pl-6 text-[8px] text-neutral-400">
            <span className="grid size-3.5 place-items-center rounded-full bg-neutral-100 text-[6px] font-bold text-neutral-500 ring-2 ring-white">
              M
            </span>
            Maya is typing…
          </div>
        </div>
        <div className="p-2.5 pt-0">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[9px] text-neutral-400">
            Message #general
          </div>
        </div>
      </div>
    </div>
  );
}
