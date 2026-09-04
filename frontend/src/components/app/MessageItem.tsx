import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

export type Message = { id: string; author: string; initials: string; timestamp: string; body: string; accent: "violet" | "cyan" | "amber"; isOwn: boolean; edited?: boolean };

export function MessageItem({ message, onEdit, onDelete }: { message: Message; onEdit?: (id: string, body: string) => Promise<void>; onDelete?: (id: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [busy, setBusy] = useState(false);
  const saveEdit = async () => {
    if (!onEdit || !draft.trim()) return;
    setBusy(true);
    try {
      await onEdit(message.id, draft.trim());
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!onDelete) return;
    setBusy(true);
    try {
      await onDelete(message.id);
    } finally {
      setBusy(false);
    }
  };
  return <article className={`group flex gap-3 rounded-xl px-3 py-3 transition hover:bg-white/[.04] ${message.isOwn ? "flex-row-reverse" : ""}`}><div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[.12] bg-white/[.08] text-xs font-bold text-white">{message.initials}</div><div className={`min-w-0 ${message.isOwn ? "text-right" : ""}`}><div className={`flex items-baseline gap-2 ${message.isOwn ? "justify-end" : ""}`}><span className="text-sm font-semibold text-white/90">{message.author}</span><time className="text-[11px] text-white/30">{message.timestamp}</time>{message.edited && <span className="text-[10px] text-white/30">(edited)</span>}</div>{editing ? <div className={`mt-1 flex flex-col gap-2 ${message.isOwn ? "items-end" : "items-start"}`}><textarea autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} className="w-full max-w-md rounded-2xl bg-white/[.05] px-3 py-2 text-left text-sm leading-6 text-white/80 outline-none ring-1 ring-white/20 focus:ring-stone-300" /><div className="flex gap-2"><button onClick={() => { setDraft(message.body); setEditing(false); }} className="rounded-lg px-2.5 py-1 text-xs text-stone-400 hover:bg-white/[.06]">Cancel</button><button disabled={busy || !draft.trim()} onClick={() => void saveEdit()} className="rounded-lg bg-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-900 hover:bg-white disabled:opacity-50">{busy ? "Saving…" : "Save"}</button></div></div> : <div className={`flex items-center gap-2 ${message.isOwn ? "flex-row-reverse" : ""}`}><p className={`mt-1 rounded-2xl px-3 py-2 text-sm leading-6 ${message.isOwn ? "bg-stone-200 text-stone-900" : "bg-white/[.05] text-white/58"}`}>{message.body}</p>{message.isOwn && <span className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100"><button onClick={() => { setDraft(message.body); setEditing(true); }} className="rounded-md p-1.5 text-stone-500 hover:bg-white/[.08] hover:text-stone-100" aria-label="Edit message"><Pencil size={13} /></button><button disabled={busy} onClick={() => void remove()} className="rounded-md p-1.5 text-stone-500 hover:bg-red-400/10 hover:text-red-300 disabled:opacity-50" aria-label="Delete message"><Trash2 size={13} /></button></span>}</div>}</div></article>;
}
