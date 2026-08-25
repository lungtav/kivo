type ConversationItemProps = { name: string; active?: boolean; unread?: number };

export function ConversationItem({ name, active = false, unread }: ConversationItemProps) {
  return <button className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${active ? "bg-white/14 text-white" : "text-slate-300 hover:bg-white/8 hover:text-white"}`}><span className="text-base text-slate-400">#</span><span className="min-w-0 flex-1 truncate">{name}</span>{unread ? <span className="rounded-full bg-violet-400 px-1.5 py-0.5 text-[10px] font-bold text-[#0B1020]">{unread}</span> : null}</button>;
}
