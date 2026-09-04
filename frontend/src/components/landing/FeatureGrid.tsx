import { Hash, MessageCircle, Reply, ShieldCheck, UserRound, Zap } from "lucide-react";

const features = [
  {
    icon: Hash,
    title: "Spaces & channels",
    body: "Group conversations around teams, topics, and communities — organized with categories that scale past the first hundred members.",
  },
  {
    icon: Zap,
    title: "Realtime by default",
    body: "Messages land instantly over websockets, with typing indicators, presence, and a live connection status you can trust.",
  },
  {
    icon: Reply,
    title: "Replies & history",
    body: "Quote any message to keep context tight, and scroll back through as much history as you need — not just the last screen.",
  },
  {
    icon: MessageCircle,
    title: "Direct messages",
    body: "One-to-one and group conversations live in their own home, with searchable contacts and unread counts that keep score.",
  },
  {
    icon: ShieldCheck,
    title: "Invites & roles",
    body: "Owners and admins hold the keys: invite links with limits, role management, and member controls built right in.",
  },
  {
    icon: UserRound,
    title: "Profiles with context",
    body: "Bios, shared spaces, and groups in common — know who you're talking to before you say hello.",
  },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="scroll-mt-28 w-full bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">Everything a room needs</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          A calm home for fast conversations
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Kivo keeps the essentials sharp — nothing more, nothing missing.
        </p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_12px_40px_rgba(91,53,213,0.10)]"
            >
              <div className="grid size-11 place-items-center rounded-xl bg-violet-50 text-violet-600 transition-colors duration-300 group-hover:bg-violet-600 group-hover:text-white">
                <Icon size={20} />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
