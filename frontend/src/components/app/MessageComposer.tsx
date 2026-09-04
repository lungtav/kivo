import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Paperclip, Reply, Send, X } from "lucide-react";

// mirrors the mime types the backend accepts for uploads
const ALLOWED_FILE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]);
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

type PendingFile = { file: File; previewUrl: string | null };
type Props = { channel: string; channelIcon: "#" | "@"; replyTo?: { author: string; body: string } | null; onCancelReply?: () => void; onSend: (message: string, files: File[]) => Promise<void>; onTyping: (typing: boolean) => void };

export function MessageComposer({ channel, channelIcon, replyTo, onCancelReply, onSend, onTyping }: Props) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<PendingFile[]>([]);
  filesRef.current = files;
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [message]);
  // release object URLs when the composer unmounts
  useEffect(() => () => { for (const pending of filesRef.current) if (pending.previewUrl) URL.revokeObjectURL(pending.previewUrl); }, []);
  const addFiles = (incoming: FileList | null) => {
    if (!incoming?.length) return;
    setError(null);
    const accepted: PendingFile[] = [];
    let rejection: string | null = null;
    for (const file of incoming) {
      if (!ALLOWED_FILE_TYPES.has(file.type)) { rejection = `${file.name} is not a supported file type (JPEG, PNG, WebP, MP4 or WebM).`; continue; }
      if (file.size > MAX_FILE_SIZE_BYTES) { rejection = `${file.name} is too large — the limit is 25 MB.`; continue; }
      accepted.push({ file, previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null });
    }
    if (rejection) setError(rejection);
    if (accepted.length) setFiles((current) => [...current, ...accepted]);
  };
  const selectFiles = (event: ChangeEvent<HTMLInputElement>) => { addFiles(event.target.files); event.target.value = ""; };
  const removeFile = (index: number) => {
    const target = files[index];
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    setFiles((current) => current.filter((_, i) => i !== index));
  };
  const send = async () => {
    const trimmed = message.trim();
    if ((!trimmed && files.length === 0) || sending) return;
    setSending(true); setError(null);
    try {
      await onSend(trimmed, files.map((pending) => pending.file));
      setMessage("");
      for (const pending of files) if (pending.previewUrl) URL.revokeObjectURL(pending.previewUrl);
      setFiles([]);
      onTyping(false);
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Message could not be sent."); }
    finally { setSending(false); }
  };
  const submit = (event: FormEvent) => { event.preventDefault(); void send(); };
  const formatSize = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return <form onSubmit={submit} className="shrink-0 border-t border-border bg-card px-5 pb-5 pt-3"><div className="mx-auto max-w-4xl">{replyTo && <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 text-xs text-foreground"><Reply size={13} className="shrink-0 text-muted-foreground" /><span className="shrink-0 font-semibold">{replyTo.author}</span><span className="min-w-0 flex-1 truncate text-muted-foreground">{replyTo.body}</span><button type="button" onClick={onCancelReply} className="rounded p-0.5 text-muted-foreground hover:bg-foreground/10" aria-label="Cancel reply"><X size={13} /></button></div>}<div className="flex gap-2">{files.map((pending, index) => <div key={`${pending.file.name}-${index}`} className="flex items-center gap-2 rounded-xl border border-border bg-muted p-2 text-xs text-foreground">{pending.previewUrl ? <img src={pending.previewUrl} alt={pending.file.name} className="size-12 shrink-0 rounded-lg border border-border object-cover" /> : <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-background"><Paperclip size={16} className="text-muted-foreground" /></span>}<div className="min-w-0"><p className="max-w-32 truncate">{pending.file.name}</p><p className="text-muted-foreground">{formatSize(pending.file.size)}</p></div><button type="button" onClick={() => removeFile(index)} className="ml-1 self-start rounded p-0.5 text-muted-foreground hover:bg-foreground/10" aria-label={`Remove ${pending.file.name}`}><X size={13} /></button></div>)}</div><div className="mt-2 rounded-2xl border border-border bg-muted p-2 focus-within:border-neutral-400 dark:focus-within:border-neutral-600"><textarea ref={textareaRef} value={message} onChange={(event) => { setMessage(event.target.value); onTyping(Boolean(event.target.value.trim())); }} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} rows={1} className="block min-h-10 w-full resize-none overflow-hidden bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder={`Message ${channelIcon}${channel}`} /><div className="flex items-center justify-between px-1"><div className="flex gap-1"><button type="button" onClick={() => fileInputRef.current?.click()} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground" aria-label="Attach a file"><Paperclip size={17} /></button><input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" className="hidden" onChange={selectFiles} /></div><button disabled={(!message.trim() && files.length === 0) || sending} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50" aria-label="Send message"><Send size={15} /> {sending ? (files.length > 0 ? "Uploading…" : "Sending…") : "Send"}</button></div></div>{error && <p role="alert" className="mt-2 text-xs text-red-500">{error}</p>}</div></form>;
}
