type PreviewMessage = {
  initials: string;
  name: string;
  text: string;
};

const messages: PreviewMessage[] = [
  { initials: "JD", name: "Jordan D.", text: "The new signup flow is ready for review." },
  { initials: "A", name: "Ada", text: "Nice. I’ll share it with the rest of the team." },
];

export function WorkspacePreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] shadow-2xl shadow-black/30">
      <div className="flex h-8 items-center gap-1.5 border-b border-white/10 px-3">
        <span className="size-1.5 rounded-full bg-white/40" />
        <span className="size-1.5 rounded-full bg-white/25" />
        <span className="size-1.5 rounded-full bg-white/15" />
      </div>
      <div className="flex h-64">
        <nav className="w-32 shrink-0 border-r border-white/10 p-3 text-[10px] text-white/45">
          <p className="mb-4 font-semibold uppercase tracking-[.18em]">Kivo</p>
          <p className="mb-2 uppercase tracking-[.12em] text-white/30">Channels</p>
          <p className="rounded-md bg-white/10 px-2 py-1.5 text-white"># general</p>
          <p className="px-2 py-1.5"># design</p>
          <p className="px-2 py-1.5"># shipping</p>
        </nav>
        <section className="min-w-0 flex-1 bg-black/20 p-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div><p className="text-xs font-semibold"># general</p><p className="mt-0.5 text-[10px] text-white/45">12 members</p></div>
            <span className="rounded-md border border-white/15 px-2 py-1 text-[9px] text-white/50">⌘ K</span>
          </div>
          <div className="space-y-3 pt-4">
            {messages.map((message) => <div key={message.name} className="flex gap-2"><span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-white text-[9px] font-bold text-black">{message.initials}</span><p className="min-w-0 text-[10px] leading-4 text-white/60"><strong className="mr-1 text-white">{message.name}</strong>{message.text}</p></div>)}
          </div>
          <div className="mt-4 rounded-lg border border-white/15 px-2.5 py-2 text-[10px] text-white/35">Message #general</div>
        </section>
      </div>
    </div>
  );
}
