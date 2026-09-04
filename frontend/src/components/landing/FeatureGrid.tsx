const features = [
  {
    title: "Spaces & channels",
    body: "Group conversations around teams, topics, and communities — organized with categories that scale.",
  },
  {
    title: "Realtime by default",
    body: "Messages land instantly, with typing indicators, presence, and a live connection status you can trust.",
  },
  {
    title: "Replies & history",
    body: "Quote any message to keep context tight, and scroll back through as much history as you need.",
  },
  {
    title: "Direct messages",
    body: "One-to-one and group conversations in their own home, with unread counts that keep score.",
  },
  {
    title: "Invites & roles",
    body: "Invite links with limits, role management, and member controls for owners and admins.",
  },
  {
    title: "Profiles with context",
    body: "Bios, shared spaces, and groups in common — know who you're talking to before you say hello.",
  },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="scroll-mt-28 w-full border-t border-neutral-100 bg-white py-24">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="max-w-xl text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
          Everything a room needs. Nothing it doesn't.
        </h2>
        <div className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="border-t border-neutral-200 pt-6">
              <h3 className="text-sm font-semibold text-neutral-950">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-500">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
