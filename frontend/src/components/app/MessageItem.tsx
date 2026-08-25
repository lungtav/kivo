export type Message = {
  id: string;
  author: string;
  initials: string;
  timestamp: string;
  body: string;
  accent: "violet" | "cyan" | "amber";
};

const accents = { violet: "bg-violet-100 text-violet-700", cyan: "bg-cyan-100 text-cyan-700", amber: "bg-amber-100 text-amber-700" };

export function MessageItem({ message }: { message: Message }) {
  return (
    <article className="group flex gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50">
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${accents[message.accent]}`}>{message.initials}</div>
      <div className="min-w-0"><div className="flex items-baseline gap-2"><span className="text-sm font-semibold text-slate-900">{message.author}</span><time className="text-xs text-slate-400">{message.timestamp}</time></div><p className="mt-0.5 text-sm leading-6 text-slate-600">{message.body}</p></div>
    </article>
  );
}
