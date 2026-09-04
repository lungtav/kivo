import { useEffect, useState } from "react";
import { FileDown, MessageSquareOff, Pencil, Reply, Trash2 } from "lucide-react";
import { getAttachmentReadUrl } from "../../lib/workspace";

export type Message = { id: string; author: string; authorId: string; initials: string; timestamp: string; body: string; accent: "violet" | "cyan" | "amber"; isOwn: boolean; sentAt: Date; edited?: boolean; deleted?: boolean; attachments?: { id: string; mediaType: string; mimeType: string }[]; replyTo?: { id: string; author: string; body: string } };

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
  if (failed) return <p className="rounded-lg bg-muted px-2.5 py-1.5 text-xs text-red-500">Attachment unavailable.</p>;
  if (!readUrl) return <div className="h-24 w-40 animate-pulse rounded-xl bg-muted" />;
  if (attachment.mediaType === "image") return <img src={readUrl} alt="Attachment" className="max-h-72 rounded-xl border border-border object-contain" />;
  if (attachment.mediaType === "video") return <video src={readUrl} controls className="max-h-72 rounded-xl border border-border" />;
  return <a href={readUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs text-foreground hover:bg-foreground/10"><FileDown size={14} /> Open attachment</a>;
}

export function MessageItem({ message, onEdit, onDelete, onReply, onViewProfile }: { message: Message; onEdit?: (id: string, body: string) => Promise<void>; onDelete?: (id: string) => Promise<void>; onReply?: (message: Message) => void; onViewProfile?: (userId: string) => void }) {
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
  return <article id={`message-${message.id}`} className={`group flex gap-3 rounded-xl px-3 py-3 transition hover:bg-foreground/[.04] ${message.isOwn ? "flex-row-reverse" : ""}`}><div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-xs font-bold text-muted-foreground">{message.initials}</div><div className={`min-w-0 ${message.isOwn ? "text-right" : ""}`}><div className={`flex items-baseline gap-2 ${message.isOwn ? "justify-end" : ""}`}><button onClick={() => onViewProfile?.(message.authorId)} className="text-sm font-semibold text-foreground transition-colors hover:text-muted-foreground">{message.author}</button><time className="text-[11px] text-muted-foreground">{message.timestamp}</time>{message.edited && <span className="text-[10px] text-muted-foreground">(edited)</span>}</div>{message.replyTo && <button onClick={() => document.getElementById(`message-${message.replyTo!.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })} className={`mt-1 flex max-w-md items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-left text-[11px] text-muted-foreground hover:bg-foreground/10 ${message.isOwn ? "ml-auto" : ""}`}><Reply size={11} className="shrink-0" /><span className="shrink-0 font-semibold text-foreground">{message.replyTo.author}</span><span className="truncate">{message.replyTo.body}</span></button>}{message.deleted ? <p className={`mt-1 flex items-center gap-1.5 rounded-2xl border border-dashed border-border px-3 py-2 text-xs italic text-muted-foreground ${message.isOwn ? "ml-auto" : ""}`}><MessageSquareOff size={13} className="shrink-0" /> This message was deleted</p> : editing ? <div className={`mt-1 flex flex-col gap-2 ${message.isOwn ? "items-end" : "items-start"}`}><textarea autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} className="w-full max-w-md rounded-2xl bg-background px-3 py-2 text-left text-sm leading-6 text-foreground outline-none ring-1 ring-border focus:ring-neutral-400 dark:focus:ring-neutral-600" /><div className="flex gap-2"><button onClick={() => { setDraft(message.body); setEditing(false); }} className="rounded-lg px-2.5 py-1 text-xs text-muted-foreground hover:bg-foreground/5">Cancel</button><button disabled={busy || !draft.trim()} onClick={() => void saveEdit()} className="rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{busy ? "Saving…" : "Save"}</button></div></div> : <div className={`flex items-center gap-2 ${message.isOwn ? "flex-row-reverse" : ""}`}><p className={`mt-1 rounded-2xl px-3 py-2 text-sm leading-6 ${message.isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{message.body}</p>{message.isOwn && <span className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100"><button onClick={() => onReply?.(message)} className="rounded-md p-1.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground" aria-label="Reply to message"><Reply size={13} /></button><button onClick={() => { if (!onEdit) return; setDraft(message.body); setEditing(true); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground" aria-label="Edit message"><Pencil size={13} /></button><button disabled={busy} onClick={() => void remove()} className="rounded-md p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50" aria-label="Delete message"><Trash2 size={13} /></button></span>}</div>}{message.attachments && message.attachments.length > 0 && <div className={`mt-1.5 flex flex-wrap gap-2 ${message.isOwn ? "justify-end" : "justify-start"}`}>{message.attachments.map((attachment) => <AttachmentView key={attachment.id} attachment={attachment} />)}</div>}</div></article>;
}
