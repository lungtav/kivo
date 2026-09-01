import { useEffect, useRef, useState, type FormEvent } from "react";
import { Paperclip, Send, Smile } from "lucide-react";

type Props = { channel: string; onSend: (message: string) => Promise<void>; onTyping: (typing: boolean) => void };

export function MessageComposer({ channel, onSend, onTyping }: Props) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [message]);
  const send = async () => {
    const trimmed = message.trim();
    if (!trimmed || sending) return;
    setSending(true); setError(null);
    try { await onSend(trimmed); setMessage(""); onTyping(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Message could not be sent."); }
    finally { setSending(false); }
  };
  const submit = (event: FormEvent) => { event.preventDefault(); void send(); };
  return <form onSubmit={submit} className="shrink-0 border-t border-white/[.06] bg-[#1b1b20] px-5 pb-5 pt-3"><div className="mx-auto max-w-4xl rounded-2xl border border-white/[.09] bg-[#131317] p-2 shadow-[0_-10px_30px_rgba(0,0,0,.08)] focus-within:border-stone-400"><textarea ref={textareaRef} value={message} onChange={(event) => { setMessage(event.target.value); onTyping(Boolean(event.target.value.trim())); }} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} rows={1} className="block min-h-10 w-full resize-none overflow-hidden bg-transparent px-2 py-2 text-sm text-stone-100 outline-none placeholder:text-stone-600" placeholder={`Message #${channel}`} /><div className="flex items-center justify-between px-1"><div className="flex gap-1"><button type="button" className="grid size-8 place-items-center rounded-lg text-stone-500 hover:bg-white/[.07] hover:text-stone-100" aria-label="Attach a file"><Paperclip size={17} /></button><button type="button" className="grid size-8 place-items-center rounded-lg text-stone-500 hover:bg-white/[.07] hover:text-stone-100" aria-label="Add emoji"><Smile size={17} /></button></div><button disabled={!message.trim() || sending} className="flex items-center gap-1.5 rounded-lg bg-stone-200 px-3 py-2 text-xs font-semibold text-stone-900 hover:bg-white disabled:bg-white/[.08] disabled:text-stone-600" aria-label="Send message"><Send size={15} /> {sending ? "Sending…" : "Send"}</button></div></div>{error && <p role="alert" className="mx-auto mt-2 max-w-4xl text-xs text-red-300">{error}</p>}</form>;
}
