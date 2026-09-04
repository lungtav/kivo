import { AtSign, Hash, MessageSquare } from "lucide-react";

const dms = [
  { name: "Maya Chen", initials: "MC", preview: "Sent the updated roadmap", unread: 2, active: true },
  { name: "Tola Ade", initials: "TA", preview: "You: shipping after standup", unread: 0, active: false },
  { name: "Design crew", initials: "DC", preview: "Ravi: new icons look 🔥", unread: 5, active: false },
];

export default function CommunityShowcase() {
  return (
    <section id="communities" className="scroll-mt-28 w-full bg-[#0B1020] py-24 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-300">Direct messages</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          Your people are one click away
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
          A dedicated home for DMs — with unread badges, searchable contacts, and profiles that show what you have in common.
        </p>

        <div className="mt-12 overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl">
          <div className="grid md:grid-cols-[300px_1fr]">
            {/* conversations panel */}
            <div className="hidden border-r border-white/[.06] bg-[#101016] md:block">
              <div className="flex items-center justify-between border-b border-white/[.06] px-5 py-4">
                <h3 className="text-sm font-semibold text-stone-100">Direct messages</h3>
                <span className="grid size-6 place-items-center rounded-md bg-violet-500/20 text-[11px] font-bold text-violet-300">+</span>
              </div>
              <div className="space-y-1 p-3">
                {dms.map((dm) => (
                  <div key={dm.name} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${dm.active ? "bg-stone-200 text-stone-900" : "text-stone-400"}`}>
                    <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[9px] font-bold ${dm.active ? "bg-violet-500 text-white" : "bg-violet-400/80 text-violet-950"}`}>{dm.initials}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{dm.name}</span>
                      <span className={`block truncate text-[11px] ${dm.active ? "text-stone-500" : "text-stone-600"}`}>{dm.preview}</span>
                    </span>
                    {dm.unread > 0 && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-violet-500 px-1 text-[9px] font-bold text-white">{dm.unread}</span>}
                  </div>
                ))}
                <div className="mt-3 rounded-xl border border-dashed border-white/[.12] px-3 py-2.5 text-[11px] text-stone-500">
                  Search anyone you share a space with…
                </div>
              </div>
            </div>
            {/* thread panel */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2.5 border-b border-white/[.06] px-5 py-3.5">
                <AtSign size={16} className="text-stone-500" />
                <span className="text-sm font-semibold text-stone-100">Maya Chen</span>
                <span className="ml-auto flex items-center gap-1.5 text-[11px] text-emerald-300/80"><span className="size-1.5 rounded-full bg-emerald-400" />Live</span>
              </div>
              <div className="flex-1 space-y-4 p-5">
                <div className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-white/[.12] bg-white/[.08] text-[10px] font-bold">MC</span>
                  <div>
                    <p className="text-sm font-semibold text-white/90">Maya Chen <span className="ml-1 text-[11px] font-normal text-white/30">6:02 PM</span></p>
                    <p className="mt-1 max-w-md rounded-2xl bg-white/[.05] px-3 py-2 text-sm leading-6 text-white/70">Roadmap v3 is out — the realtime section is what changed most.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 flex-row-reverse">
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-stone-200 text-[10px] font-bold text-stone-900">JD</span>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white/90">You <span className="ml-1 text-[11px] font-normal text-white/30">6:04 PM</span></p>
                    <div className="mt-1 ml-auto max-w-md rounded-xl border-l-2 border-violet-400/60 bg-white/[.03] px-2.5 py-1 text-left text-[11px] text-stone-400"><span className="font-semibold text-stone-300">Maya Chen</span> Roadmap v3 is out…</div>
                    <p className="mt-1 ml-auto max-w-md rounded-2xl bg-stone-200 px-3 py-2 text-sm leading-6 text-stone-900">Reading it now — replies made this so much easier.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-11 text-xs text-stone-500">
                  <span className="flex -space-x-1.5">
                    <span className="grid size-5 place-items-center rounded-full bg-violet-400 text-[8px] font-bold text-violet-950 ring-2 ring-[#12121a]">MC</span>
                  </span>
                  Maya is typing…
                </div>
              </div>
              <div className="border-t border-white/[.06] p-4">
                <div className="rounded-xl border border-white/[.1] bg-[#17171f] px-3 py-2.5 text-sm text-stone-600">Message @Maya Chen</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            { icon: AtSign, title: "Unread that keeps score", body: "Badges per conversation and a total on the rail — nothing slips past." },
            { icon: MessageSquare, title: "Common ground", body: "Profiles surface the spaces and groups you already share." },
            { icon: Hash, title: "Groups for the in-between", body: "Small group conversations that don't need a whole space." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-white/[.08] bg-white/[.03] p-5">
              <Icon size={18} className="text-violet-300" />
              <h3 className="mt-3 text-sm font-semibold text-stone-100">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
