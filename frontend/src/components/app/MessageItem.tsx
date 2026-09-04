import { useEffect, useState } from "react";
import { FileDown, Pencil, Reply, Trash2 } from "lucide-react";
import { getAttachmentReadUrl } from "../../lib/workspace";

export type Message = { id: string; author: string; initials: string; timestamp: string; body: string; accent: "violet" | "cyan" | "amber"; isOwn: boolean; edited?: boolean; attachments?: { id: string; mediaType: string; mimeType: string }[]; replyTo?: { id: string; author: string; body: string } };

function AttachmentView({ attachment }: { attachment: { id: string; mediaType: string; mimeType: string } }) {
  const [readUrl, setReadUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    void getAttachmentReadUrl(attachment.id)
      .then(({ readUrl: url }) => { if (active) setReadUrl(url); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [attachment.id]);
  if (failed) return <p className="rounded-lg bg-white/[.05] px-2.5 py-1.5 text-xs text-red-300">Attachment unavailable.</p>;
  if (!readUrl) return <div className="h-24 w-40 animate-pulse rounded-xl bg-white/[.06]" />;
  if (attachment.mediaType === "image") return <img src={readUrl} alt="Attachment" className="max-h-72 rounded-xl border border-white/10 object-contain" />;
  if (attachment.mediaType === "video") return <video src={readUrl} controls className="max-h-72 rounded-xl border border-white/10" />;
  return <a href={readUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-white/[.06] px-2.5 py-1.5 text-xs text-stone-200 hover:bg-white/[.1]"><FileDown size={14} /> Open attachment</a>;
}

export function MessageItem({ message, onEdit, onDelete, onReply }: { message: Message; onEdit?: (id: string, body: string) => Promise<void>; onDelete?: (id: string) => Promise<void>; onReply?: (message: Message) => void }) {
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
  return <article id={`message-${message.id}`} className={`group flex gap-3 rounded-xl px-3 py-3 transition hover:bg-white/[.04] ${message.isOwn ? "flex-row-reverse" : ""}`}><div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[.12] bg-white/[.08] text-xs font-bold text-white">{message.initials}</div><div className={`min-w-0 ${message.isOwn ? "text-right" : ""}`}><div className={`flex items-baseline gap-2 ${message.isOwn ? "justify-end" : ""}`}><span className="text-sm font-semibold text-white/90">{message.author}</span><time className="text-[11px] text-white/30">{message.timestamp}</time>{message.edited && <span className="text-[10px] text-white/30">(edited)</span>}</div>{message.replyTo && <button onClick={() => document.getElementById(`message-${message.replyTo!.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })} className={`mt-1 flex max-w-md items-center gap-1.5 rounded-lg bg-white/[.04] px-2.5 py-1 text-left text-[11px] text-stone-400 hover:bg-white/[.08] ${message.isOwn ? "ml-auto" : ""}`}><Reply size={11} className="shrink-0" /><span className="shrink-0 font-semibold text-stone-300">{message.replyTo.author}</span><span className="truncate">{message.replyTo.body}</span></button>}{editing ? <div className={`mt-1 flex flex-col gap-2 ${message.isOwn ? "items-end" : "items-start"}`}><textarea autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} className="w-full max-w-md rounded-2xl bg-white/[.05] px-3 py-2 text-left text-sm leading-6 text-white/80 outline-none ring-1 ring-white/20 focus:ring-stone-300" /><div className="flex gap-2"><button onClick={() => { setDraft(message.body); setEditing(false); }} className="rounded-lg px-2.5 py-1 text-xs text-stone-400 hover:bg-white/[.06]">Cancel</button><button disabled={busy || !draft.trim()} onClick={() => void saveEdit()} className="rounded-lg bg-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-900 hover:bg-white disabled:opacity-50">{busy ? "Saving…" : "Save"}</button></div></div> : <div className={`flex items-center gap-2 ${message.isOwn ? "flex-row-reverse" : ""}`}><p className={`mt-1 rounded-2xl px-3 py-2 text-sm leading-6 ${message.isOwn ? "bg-stone-200 text-stone-900" : "bg-white/[.05] text-white/58"}`}>{message.body}</p><span className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100"><button onClick={() => onReply?.(message)} className="rounded-md p-1.5 text-stone-500 hover:bg-white/[.08] hover:text-stone-100" aria-label="Reply to message"><Reply size={13} /></button>{message.isOwn && <><button onClick={() => { if (!onEdit) return; setDraft(message.body); setEditing(true); }} className="rounded-md p-1.5 text-stone-500 hover:bg-white/[.08] hover:text-stone-100" aria-label="Edit message"><Pencil size={13} /></button><button disabled={busy} onClick={() => void remove()} className="rounded-md p-1.5 text-stone-500 hover:bg-red-400/10 hover:text-red-300 disabled:opacity-50" aria-label="Delete message"><Trash2 size={13} /></button></>}</span></div>}{message.attachments && message.attachments.length > 0 && <div className={`mt-1.5 flex flex-wrap gap-2 ${message.isOwn ? "justify-end" : "justify-start"}`}>{message.attachments.map((attachment) => <AttachmentView key={attachment.id} attachment={attachment} />)}</div>}</div></article>;
}
