import { useEffect, useState } from "react";
import { ArrowLeft, Hash, MessageCircle, MessageSquare, Users } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getProfile, type ProfilePayload } from "../lib/workspace";

const initials = (name: string) => name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProfile(null);
    setError(null);
    if (!userId) return;
    void getProfile(userId)
      .then(setProfile)
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load this profile."));
  }, [userId]);

  const openSpace = (spaceId: string) => navigate("/app", { state: { spaceId } });
  const openConversation = (conversationId: string) => navigate("/app", { state: { conversationId } });

  const isSelf = profile?.user && "email" in profile.user;
  const joinedAt = profile?.user.created_at ? new Date(profile.user.created_at).toLocaleDateString(undefined, { dateStyle: "long" }) : null;

  return <main className="min-h-svh bg-background text-foreground"><div className="mx-auto max-w-2xl px-6 py-10">
    <Link to="/app" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-stone-100"><ArrowLeft size={15} /> Back to workspace</Link>
    {error && <p role="alert" className="mt-8 rounded-xl border border-red-400/30 bg-red-400/[.06] px-4 py-3 text-sm text-red-300">{error}</p>}
    {!profile && !error && <p className="mt-8 text-sm text-stone-500">Loading profile…</p>}
    {profile && <div className="mt-8">
      <div className="flex items-center gap-5">
        {profile.user.avatar_url ? <img src={profile.user.avatar_url} alt="" className="size-20 rounded-2xl border border-white/[.1] object-cover" /> : <div className="grid size-20 place-items-center rounded-2xl border border-white/[.12] bg-muted text-xl font-bold">{initials(profile.user.display_name)}</div>}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-[-0.02em]">{profile.user.display_name}</h1>
          <p className="truncate text-sm text-stone-500">@{profile.user.username}</p>
          <p className="mt-1 text-xs text-muted-foreground">In Kivo since {joinedAt}</p>
        </div>
      </div>
      {isSelf && <p className="mt-3 text-xs text-muted-foreground">{profile.user.email}</p>}
      {profile.user.bio && <p className="mt-6 whitespace-pre-wrap text-sm leading-6 text-stone-300">{profile.user.bio}</p>}
      {profile.directConversationId && <button onClick={() => openConversation(profile.directConversationId!)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-200 px-4 py-3 text-sm font-semibold text-stone-900 transition hover:bg-white"><MessageCircle size={16} /> Message {profile.user.display_name}</button>}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-stone-500"><Hash size={13} /> Spaces in common <span className="text-stone-700">({profile.commonSpaces.length})</span></h2>
        {profile.commonSpaces.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">{isSelf ? "You haven't joined any spaces yet." : "You don't share any spaces with this member."}</p> : <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">{profile.commonSpaces.map((space) => <button key={space.id} onClick={() => openSpace(space.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-foreground/5"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">{initials(space.name)}</span><span className="min-w-0 flex-1 truncate text-sm text-foreground">{space.name}</span><span className="shrink-0 text-xs text-muted-foreground">Open</span></button>)}</div>}
      </section>
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-stone-500"><Users size={13} /> Groups in common <span className="text-stone-700">({profile.commonGroups.length})</span></h2>
        {profile.commonGroups.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">{isSelf ? "You're not in any group conversations yet." : "You don't share any group conversations with this member."}</p> : <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">{profile.commonGroups.map((group) => <button key={group.id} onClick={() => openConversation(group.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-foreground/5"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted"><MessageSquare size={15} className="text-muted-foreground" /></span><span className="min-w-0 flex-1 truncate text-sm text-foreground">{group.name}</span><span className="shrink-0 text-xs text-muted-foreground">{group.member_count} members</span></button>)}</div>}
      </section>
      <p className="mt-10 text-center text-[11px] text-stone-700">Kivo profiles are visible to people you share spaces with.</p>
    </div>}
  </div></main>;
}
