import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";

export function MessageComposer({ channel }: { channel: string }) {
  const [message, setMessage] = useState("");
  const submit = (event: FormEvent) => { event.preventDefault(); setMessage(""); };
  return <form onSubmit={submit} className="border-t border-slate-100 p-4"><div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-slate-400"><input value={message} onChange={(event) => setMessage(event.target.value)} className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-slate-400" placeholder={`Message #${channel}`} /><button aria-label="Send message" className="rounded-lg bg-[#0B1020] p-2 text-white transition hover:bg-slate-800"><Send size={15} /></button></div></form>;
}
