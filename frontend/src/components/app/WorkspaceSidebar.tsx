import { ChevronDown, Plus } from "lucide-react";
import { Brand } from "../brand/Brand";
import { ConversationItem } from "./ConversationItem";

export function WorkspaceSidebar() {
  return <aside className="flex w-64 shrink-0 flex-col bg-[#0B1020] p-3 text-white"><Brand light className="px-2 py-3" /><button className="mt-3 flex items-center justify-between rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold">Design team <ChevronDown size={16} /></button><div className="mt-6 flex items-center justify-between px-3 text-[11px] font-semibold uppercase tracking-[.14em] text-slate-500"><span>Channels</span><Plus size={15} /></div><nav className="mt-2 space-y-0.5"><ConversationItem name="general" /><ConversationItem name="sprint-planning" active unread={2} /><ConversationItem name="design-review" /></nav><div className="mt-auto rounded-xl bg-white/8 p-3 text-xs leading-5 text-slate-400">Invite your team to make this space feel like home.</div></aside>;
}
