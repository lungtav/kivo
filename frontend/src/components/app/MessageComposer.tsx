import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Paperclip, Reply, Send, Smile, X } from "lucide-react";

// mirrors the mime types the backend accepts for uploads
const ALLOWED_FILE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]);
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

type Props = { channel: string; channelIcon: "#" | "@"; replyTo?: { author: string; body: string } | null; onCancelReply?: () => void; onSend: (message: string, files: File[]) => Promise<void>; onTyping: (typing: boolean) => void };

export function MessageComposer({ channel, channelIcon, replyTo, onCancelReply, onSend, onTyping }: Props) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [message]);
  const addFiles = (incoming: FileList | null) => {
    if (!incoming?.length) return;
    setError(null);
    setFiles((current) => {
      const next = [...current];
      for (const file of incoming) {
        if (!ALLOWED_FILE_TYPES.has(file.type)) {
          setError(`${file.name} is not a supported file type (JPEG, PNG, WebP, MP4 or WebM).`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          setError(`${file.name} is too large — the limit is 25 MB.`);
          continue;
        }
        next.push(file);
      }
      return next;
    });
  };
  const selectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(event.target.files);
    event.target.value = "";
  };
  const send = async () => {
    const trimmed = message.trim();
    if ((!trimmed && files.length === 0) || sending) return;
    setSending(true); setError(null);
    try {
      await onSend(trimmed, files);
      setMessage("");
      setFiles([]);
      onTyping(false);
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Message could not be sent."); }
    finally { setSending(false); }
  };
  const submit = (event: FormEvent) => { event.preventDefault(); void send(); };
  const formatSize = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return <form onSubmit={submit} className="shrink-0 border-t border-white/[.06] bg-[#1b1b20] px-5 pb-5 pt-3"><div className="mx-auto max-w-4xl">{replyTo && <div className="mb-2 flex items-center gap-2 rounded-xl border border-white/[.09] bg-[#131317] px-3 py-2 text-xs text-stone-300"><Reply size={13} className="shrink-0 text-stone-500" /><span className="shrink-0 font-semibold">{replyTo.author}</span><span className="min-w-0 flex-1 truncate text-stone-500">{replyTo.body}</span><button type="button" onClick={onCancelReply} className="rounded p-0.5 text-stone-500 hover:bg-white/[.08] hover:text-stone-100" aria-label="Cancel reply"><X size={13} /></button></div>}<div className="flex gap-2">{files.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-xl border border-white/[.1] bg-[#131317] px-3 py-2 text-xs text-stone-200"><Paperclip size={13} className="shrink-0 text-stone-500" /><span className="max-w-40 truncate">{file.name}</span><span className="shrink-0 text-stone-500">{formatSize(file.size)}</span><button type="button" onClick={() => setFiles((current) => current.filter((_, i) => i !== index))} className="rounded p-0.5 text-stone-500 hover:bg-white/[.08] hover:text-stone-100" aria-label={`Remove ${file.name}`}><X size={13} /></button></div>)}</div><div className="mt-2 rounded-2xl border border-white/[.09] bg-[#131317] p-2 shadow-[0_-10px_30px_rgba(0,0,0,.08)] focus-within:border-stone-400"><textarea ref={textareaRef} value={message} onChange={(event) => { setMessage(event.target.value); onTyping(Boolean(event.target.value.trim())); }} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} rows={1} className="block min-h-10 w-full resize-none overflow-hidden bg-transparent px-2 py-2 text-sm text-stone-100 outline-none placeholder:text-stone-600" placeholder={`Message ${channelIcon}${channel}`} /><div className="flex items-center justify-between px-1"><div className="flex gap-1"><button type="button" onClick={() => fileInputRef.current?.click()} className="grid size-8 place-items-center rounded-lg text-stone-500 hover:bg-white/[.07] hover:text-stone-100" aria-label="Attach a file"><Paperclip size={17} /></button><input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" className="hidden" onChange={selectFiles} /><button type="button" className="grid size-8 place-items-center rounded-lg text-stone-500 hover:bg-white/[.07] hover:text-stone-100" aria-label="Add emoji"><Smile size={17} /></button></div><button disabled={(!message.trim() && files.length === 0) || sending} className="flex items-center gap-1.5 rounded-lg bg-stone-200 px-3 py-2 text-xs font-semibold text-stone-900 hover:bg-white disabled:bg-white/[.08] disabled:text-stone-600" aria-label="Send message"><Send size={15} /> {sending ? (files.length > 0 ? "Uploading…" : "Sending…") : "Send"}</button></div></div>{error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}</div></form>;
}
