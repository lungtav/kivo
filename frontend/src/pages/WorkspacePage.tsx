import { Hash, Users } from "lucide-react";
import { MessageComposer } from "../components/app/MessageComposer";
import { MessageItem, type Message } from "../components/app/MessageItem";
import { WorkspaceShell } from "../components/app/WorkspaceShell";

const messages: Message[] = [
  { id: "1", author: "Jordan D.", initials: "JD", timestamp: "11:05 AM", body: "Shared the web app link with the external vendors. Instant access worked smoothly.", accent: "violet" },
  { id: "2", author: "Ada", initials: "A", timestamp: "11:12 AM", body: "Great. I’ve added the final user flows to the design review channel.", accent: "cyan" },
  { id: "3", author: "Mo", initials: "M", timestamp: "11:18 AM", body: "I’ll pick up the remaining interaction states after lunch.", accent: "amber" },
];

export default function WorkspacePage() {
  return <WorkspaceShell><header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6"><div className="flex items-center gap-2"><Hash size={20} className="text-slate-500" /><h1 className="font-semibold text-slate-950">sprint-planning</h1></div><button className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-slate-500 hover:bg-slate-50"><Users size={16} /> 12</button></header><div className="flex min-h-0 flex-1 flex-col"><div className="flex-1 overflow-auto px-4 py-6 sm:px-7"><div className="mx-auto max-w-3xl"><h2 className="text-xl font-bold tracking-tight text-slate-950"># sprint-planning</h2><p className="mt-1 text-sm text-slate-500">Plan the work, then make it happen.</p><div className="mt-7 space-y-1">{messages.map((message) => <MessageItem key={message.id} message={message} />)}</div></div></div><MessageComposer channel="sprint-planning" /></div></WorkspaceShell>;
}
