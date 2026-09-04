import { ChevronLeft, ChevronRight, Copy, DoorOpen, Hash, LogOut, MessageCircle, Plus, Settings, Trash2, User, Users } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import kivoLogo from "../../assets/kivo-logo.jfif";
import { logout } from "../../lib/auth";
import { getRealtimeSocket } from "../../lib/realtime";
import {
  changeMemberRole,
  conversationDisplayName,
  createInvite,
  getMe,
  kickMember,
  listInvites,
  listPeers,
  listSpaceMembers,
  revokeInvite,
  updateProfile,
  type Channel,
  type DirectConversation,
  type Peer,
  type Space,
  type SpaceInvite,
  type SpaceMember,
  type SpaceStructure,
  type UserProfile,
} from "../../lib/workspace";

type Props = {
  isOpen: boolean; onToggle: () => void; spaces: Space[]; space: SpaceStructure | null;
  view: "home" | "space"; onSelectHome: () => void;
  selectedSpaceId: string | null; selectedChannelId: string | null;
  directMessages: DirectConversation[]; selectedDirectId: string | null;
  onSelectDirect: (id: string) => void; onCreateDirect: (userId: string) => Promise<void>;
  onSelectSpace: (id: string) => void; onSelectChannel: (id: string) => void;
  onCreateCategory: (name: string) => Promise<void>; onCreateChannel: (name: string, categoryId: string | null) => Promise<void>;
  onCreateSpace: (name: string) => Promise<void>; onDeleteChannel: (id: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>; onDeleteSpace: () => Promise<void>;
  onLeaveSpace: () => Promise<void>; onJoinSpace: (code: string) => Promise<void>;
};
type Creating = { kind: "space" | "category" | "channel"; categoryId?: string | null } | null;
type Deleting = { kind: "space" | "category" | "channel"; id?: string; name: string } | null;
const initials = (name: string) => name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();

export function WorkspaceSidebar(props: Props) {
  const { isOpen, onToggle, spaces, space, selectedSpaceId, selectedChannelId, onSelectSpace, onSelectChannel, view, onSelectHome, directMessages, selectedDirectId, onSelectDirect } = props;
  const navigate = useNavigate();
  const [creating, setCreating] = useState<Creating>(null);
  const [deleting, setDeleting] = useState<Deleting>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [name, setName] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [dmQuery, setDmQuery] = useState("");
  const [peerQuery, setPeerQuery] = useState("");
  const [peers, setPeers] = useState<Peer[] | null>(null);
  const [membersError, setMembersError] = useState<string | null>(null);
  const viewProfile = (userId: string) => navigate(`/app/profile/${userId}`);
  const canManage = space?.role === "owner" || space?.role === "admin";
  useEffect(() => { setDeleteConfirmation(""); setError(null); }, [deleting]);
  const startCreate = (kind: NonNullable<Creating>["kind"], categoryId?: string | null) => { setName(""); setError(null); setCreating({ kind, categoryId }); };
  const openMemberPicker = () => {
    setPeers(null);
    setMembersError(null);
    setPeerQuery("");
    setMemberPickerOpen(true);
    void listPeers()
      .then(({ peers: items }) => setPeers(items))
      .catch((cause) => setMembersError(cause instanceof Error ? cause.message : "Could not load people."));
  };
  const dmQueryLower = dmQuery.trim().toLowerCase();
  const visibleConversations = dmQueryLower ? directMessages.filter((dm) => conversationDisplayName(dm).toLowerCase().includes(dmQueryLower)) : directMessages;
  const totalUnread = directMessages.reduce((sum, dm) => sum + dm.unread_count, 0);
  const peerQueryLower = peerQuery.trim().toLowerCase();
  const visiblePeers = peers ? peers.filter((peer) => peer.display_name.toLowerCase().includes(peerQueryLower) || peer.username.toLowerCase().includes(peerQueryLower)) : [];
  const pickMember = async (userId: string) => {
    setBusy(true);
    setMembersError(null);
    try {
      await props.onCreateDirect(userId);
      setMemberPickerOpen(false);
    } catch (cause) {
      setMembersError(cause instanceof Error ? cause.message : "Could not start the conversation.");
    } finally {
      setBusy(false);
    }
  };
  const submitJoin = async (event: FormEvent) => {
    event.preventDefault();
    if (!joinCode.trim()) return;
    setJoinBusy(true);
    setJoinError(null);
    try {
      await props.onJoinSpace(joinCode.trim());
      setJoinOpen(false);
      setJoinCode("");
    } catch (cause) {
      setJoinError(cause instanceof Error ? cause.message : "Could not join with that code.");
    } finally {
      setJoinBusy(false);
    }
  };
  const submitCreate = async (event: FormEvent) => {
    event.preventDefault(); if (!creating || !name.trim()) return;
    setBusy(true); setError(null);
    try {
      if (creating.kind === "space") await props.onCreateSpace(name.trim());
      if (creating.kind === "category") await props.onCreateCategory(name.trim());
      if (creating.kind === "channel") await props.onCreateChannel(name.trim(), creating.categoryId ?? null);
      setCreating(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save your changes."); }
    finally { setBusy(false); }
  };
  const confirmDelete = async () => {
    if (!deleting) return; setBusy(true); setError(null);
    try {
      if (deleting.kind === "space") await props.onDeleteSpace();
      if (deleting.kind === "category" && deleting.id) await props.onDeleteCategory(deleting.id);
      if (deleting.kind === "channel" && deleting.id) await props.onDeleteChannel(deleting.id);
      setDeleting(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete this item."); }
    finally { setBusy(false); }
  };

  return <aside className="flex h-full shrink-0 overflow-hidden bg-[#101014] text-stone-100">
    <nav className="flex h-full w-[72px] flex-col items-center gap-2 border-r border-white/[.06] bg-[#0b0b0e] py-3">
      <button className="mb-1 grid size-11 place-items-center rounded-xl" aria-label="Kivo home"><img src={kivoLogo} alt="" className="size-7 rounded-lg object-contain grayscale opacity-70" /></button>
      <button onClick={() => { setMembersOpen(false); setSettingsOpen(false); onSelectHome(); }} className={`relative grid size-11 place-items-center rounded-xl border transition ${view === "home" ? "border-stone-300 bg-stone-200 text-stone-900 shadow-lg shadow-black/20" : "border-white/[.08] bg-[#17171c] text-stone-500 hover:border-white/25 hover:bg-[#202026] hover:text-stone-100"}`} aria-label="Direct messages"><MessageCircle size={19} />{totalUnread > 0 && view !== "home" && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{totalUnread > 9 ? "9+" : totalUnread}</span>}</button>
      <button onClick={onToggle} className="grid size-11 place-items-center rounded-xl text-stone-500 hover:bg-white/[.07] hover:text-stone-100" aria-label={isOpen ? "Close workspace sidebar" : "Open workspace sidebar"}>{isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}</button>
      <div className="my-1 h-px w-8 bg-white/[.08]" />
      {spaces.map((item) => <button key={item.id} title={item.name} onClick={() => { setSettingsOpen(false); onSelectSpace(item.id); }} className={`grid size-11 place-items-center rounded-xl border text-[10px] font-bold transition ${selectedSpaceId === item.id ? "border-stone-300 bg-stone-200 text-stone-900 shadow-lg shadow-black/20" : "border-white/[.08] bg-[#17171c] text-stone-500 hover:border-white/25 hover:bg-[#202026] hover:text-stone-100"}`}>{initials(item.name)}</button>)}
      <button onClick={() => startCreate("space")} className="grid size-11 place-items-center rounded-xl border border-dashed border-white/15 text-stone-500 transition hover:border-stone-400 hover:text-stone-100" aria-label="Create a space"><Plus size={19} /></button>
      <button onClick={() => { setJoinError(null); setJoinOpen(true); }} className="grid size-11 place-items-center rounded-xl text-stone-500 hover:bg-white/[.07] hover:text-stone-100" aria-label="Join a space with an invite code"><DoorOpen size={19} /></button>
      <button onClick={() => setSettingsOpen(true)} className="mt-auto grid size-11 place-items-center rounded-xl text-stone-500 hover:bg-white/[.07] hover:text-stone-100" aria-label="Settings"><Settings size={19} /></button>
    </nav>
    <div className={`overflow-hidden transition-[width,opacity] duration-200 ${isOpen ? "w-80 opacity-100" : "w-0 opacity-0"}`}>
      <div className="flex h-full w-80 flex-col bg-[#121217]">
        {settingsOpen ? <SettingsPanel onBack={() => setSettingsOpen(false)} /> : membersOpen ? <MembersPanel spaceId={space?.id ?? null} canManage={canManage} ownRole={space?.role ?? null} onBack={() => setMembersOpen(false)} onLeaveSpace={props.onLeaveSpace} onViewProfile={viewProfile} /> : view === "home" ? <>
          <div className="border-b border-white/[.06] bg-[#16161b] px-5 py-4"><div className="flex items-center justify-between gap-3"><h2 className="truncate text-base font-semibold">Direct messages</h2><button onClick={openMemberPicker} className="rounded-md p-1.5 text-stone-400 hover:bg-white/[.07] hover:text-stone-100" aria-label="Start a conversation"><Plus size={16} /></button></div><input value={dmQuery} onChange={(event) => setDmQuery(event.target.value)} placeholder="Find a conversation" className="mt-3 w-full rounded-lg border border-white/[.1] bg-[#101014] px-3 py-2 text-sm outline-none focus:border-stone-400" /></div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 [scrollbar-width:thin] [scrollbar-color:#444_#121217]">
            {visibleConversations.length === 0 && <p className="px-2 py-4 text-sm text-stone-500">{directMessages.length === 0 ? "No conversations yet — start one with the + button above." : "No conversations match your search."}</p>}
            {visibleConversations.map((dm) => <div key={dm.id} className={`group flex items-center rounded-lg ${selectedDirectId === dm.id ? "bg-stone-200 text-stone-900" : "text-stone-500 hover:bg-white/[.07] hover:text-stone-200"}`}><button onClick={() => onSelectDirect(dm.id)} className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left text-sm"><span className={`grid size-6 shrink-0 place-items-center rounded-full text-[9px] font-bold ${selectedDirectId === dm.id ? "bg-violet-500 text-white" : "bg-violet-400 text-violet-950"}`}>{initials(conversationDisplayName(dm))}</span><span className="min-w-0 flex-1 truncate">{conversationDisplayName(dm)}</span></button>{dm.unread_count > 0 && selectedDirectId !== dm.id && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-violet-500 px-1 text-[9px] font-bold text-white">{dm.unread_count > 9 ? "9+" : dm.unread_count}</span>}{dm.peer_id && <button onClick={() => { if (dm.peer_id) viewProfile(dm.peer_id); }} className="mr-1.5 rounded p-1 opacity-0 transition group-hover:opacity-100 hover:bg-white/[.08] hover:text-stone-100" aria-label={`View ${conversationDisplayName(dm)}'s profile`}><User size={13} /></button>}</div>)}
          </div>
        </> : <>
          <div className="border-b border-white/[.06] bg-[#16161b] px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-stone-500">Space</p><div className="mt-1 flex items-center justify-between gap-3"><h2 className="truncate text-base font-semibold">{space?.name ?? "Loading…"}</h2>{canManage && <button onClick={() => setDeleting({ kind: "space", name: space?.name ?? "this space" })} className="rounded-md p-1.5 text-stone-500 hover:bg-red-400/10 hover:text-red-300" title="Delete space" aria-label="Delete space"><Trash2 size={15} /></button>}</div><div className="mt-3 flex items-center gap-2 text-xs text-stone-500"><button onClick={() => setMembersOpen(true)} className="flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-white/[.05] hover:text-stone-200"><Users size={14} /><span>{space?.role === "member" ? "Members" : "Admin controls enabled"}</span></button></div></div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-5 [scrollbar-width:thin] [scrollbar-color:#444_#121217]">
            {creating && creating.kind !== "space" && <CreateForm creating={creating} name={name} busy={busy} error={error} onName={setName} onCancel={() => setCreating(null)} onSubmit={submitCreate} />}
            <ChannelGroup name="Uncategorised" channels={space?.uncategorized_channels ?? []} selected={selectedChannelId} canManage={canManage} onSelect={onSelectChannel} onCreate={() => startCreate("channel")} onDelete={(channel) => setDeleting({ kind: "channel", id: channel.id, name: channel.name })} />
            {space?.categories.map((category) => <ChannelGroup key={category.id} name={category.name} channels={category.channels} selected={selectedChannelId} canManage={canManage} onSelect={onSelectChannel} onCreate={() => startCreate("channel", category.id)} onDelete={(channel) => setDeleting({ kind: "channel", id: channel.id, name: channel.name })} onDeleteCategory={() => setDeleting({ kind: "category", id: category.id, name: category.name })} />)}
            {canManage && <button onClick={() => startCreate("category")} className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-stone-500 transition hover:bg-white/[.05] hover:text-stone-200"><Plus size={15} /> Add category</button>}
          </div>
        </>}
      </div>
    </div>
    {creating?.kind === "space" && <Modal title="Create a space" onClose={() => setCreating(null)}><CreateForm creating={creating} name={name} busy={busy} error={error} onName={setName} onCancel={() => setCreating(null)} onSubmit={submitCreate} /></Modal>}
    {deleting && <Modal title={`Delete ${deleting.kind}`} onClose={() => setDeleting(null)}><p className="text-sm leading-6 text-stone-400">This deletes <strong className="text-stone-100">{deleting.name}</strong>. This action cannot be undone.</p><label className="mt-4 block text-xs font-medium text-stone-400">Type <strong className="text-stone-200">{deleting.name}</strong> to confirm<input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} className="mt-2 w-full rounded-lg border border-white/[.12] bg-[#101014] px-3 py-2 text-sm text-stone-100 outline-none focus:border-red-300" /></label>{error && <p className="mt-3 text-sm text-red-300">{error}</p>}<div className="mt-6 flex justify-end gap-2"><button onClick={() => setDeleting(null)} className="rounded-lg px-3 py-2 text-sm text-stone-300 hover:bg-white/[.06]">Cancel</button><button disabled={busy || deleteConfirmation !== deleting.name} onClick={() => void confirmDelete()} className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50">{busy ? "Deleting…" : "Delete permanently"}</button></div></Modal>}
    {memberPickerOpen && <Modal title="Start a direct message" onClose={() => setMemberPickerOpen(false)}><input value={peerQuery} onChange={(event) => setPeerQuery(event.target.value)} placeholder="Search people" className="w-full rounded-lg border border-white/[.1] bg-[#101014] px-3 py-2 text-sm outline-none focus:border-stone-400" />{membersError && <p className="mt-2 text-sm text-red-300">{membersError}</p>}{peers === null && !membersError && <p className="mt-2 text-sm text-stone-400">Loading people…</p>}{peers !== null && visiblePeers.length === 0 && !membersError && <p className="mt-2 text-sm text-stone-500">{peers.length === 0 ? "No one to message yet — join or create a space first." : "No one matches that search."}</p>}<div className="mt-2 max-h-64 space-y-1 overflow-y-auto">{visiblePeers.map((peer) => <button key={peer.id} onClick={() => void pickMember(peer.id)} disabled={busy} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-stone-200 hover:bg-white/[.06] disabled:opacity-50"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-violet-400 text-[9px] font-bold text-violet-950">{initials(peer.display_name)}</span><span className="min-w-0 truncate">{peer.display_name}<span className="ml-1.5 text-xs text-stone-500">@{peer.username}</span></span></button>)}</div></Modal>}
    {joinOpen && <Modal title="Join a space" onClose={() => setJoinOpen(false)}><form onSubmit={submitJoin}><label className="block text-xs font-semibold text-stone-200">Invite code</label><input autoFocus value={joinCode} onChange={(event) => setJoinCode(event.target.value)} placeholder="e.g. a1b2c3d4" className="mt-2 w-full rounded-lg border border-white/[.1] bg-[#101014] px-3 py-2 text-sm outline-none focus:border-stone-400" />{joinError && <p className="mt-2 text-xs text-red-300">{joinError}</p>}<div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setJoinOpen(false)} className="rounded-lg px-3 py-2 text-xs text-stone-400 hover:bg-white/[.06]">Cancel</button><button disabled={!joinCode.trim() || joinBusy} className="rounded-lg bg-stone-200 px-3 py-2 text-xs font-semibold text-stone-900 hover:bg-white disabled:opacity-50">{joinBusy ? "Joining…" : "Join space"}</button></div></form></Modal>}
  </aside>;
}

function ChannelGroup({ name, channels, selected, canManage, onSelect, onCreate, onDelete, onDeleteCategory }: { name: string; channels: Channel[]; selected: string | null; canManage: boolean; onSelect: (id: string) => void; onCreate: () => void; onDelete: (channel: Channel) => void; onDeleteCategory?: () => void }) {
  if (!channels.length && !canManage) return null;
  return <section className="mb-5"><div className="mb-1 flex items-center justify-between px-2"><span className="truncate text-[10px] font-bold uppercase tracking-[.16em] text-stone-600">{name}</span>{canManage && <span className="flex items-center"><button onClick={onCreate} className="rounded p-1 text-stone-600 hover:bg-white/[.06] hover:text-stone-100" aria-label={`Add a channel to ${name}`}><Plus size={14} /></button>{onDeleteCategory && <button onClick={onDeleteCategory} className="rounded p-1 text-stone-600 hover:bg-red-400/10 hover:text-red-300" aria-label={`Delete ${name}`}><Trash2 size={13} /></button>}</span>}</div>{channels.map((channel) => <div key={channel.id} className={`group flex items-center rounded-lg ${selected === channel.id ? "bg-stone-200 text-stone-900" : "text-stone-500 hover:bg-white/[.07] hover:text-stone-200"}`}><button onClick={() => onSelect(channel.id)} className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left text-sm"><Hash size={15} /><span className="truncate">{channel.name}</span></button>{canManage && <button onClick={() => onDelete(channel)} className={`mr-1 rounded p-1 opacity-0 transition group-hover:opacity-100 ${selected === channel.id ? "text-stone-600 hover:text-red-600" : "text-stone-500 hover:text-red-300"}`} aria-label={`Delete ${channel.name}`}><Trash2 size={13} /></button>}</div>)}</section>;
}

function CreateForm({ creating, name, busy, error, onName, onCancel, onSubmit }: { creating: NonNullable<Creating>; name: string; busy: boolean; error: string | null; onName: (name: string) => void; onCancel: () => void; onSubmit: (event: FormEvent) => void }) {
  const label = creating.kind === "space" ? "Space" : creating.kind === "category" ? "Category" : "Channel";
  return <form onSubmit={onSubmit} className="rounded-xl border border-white/[.1] bg-[#19191f] p-3 shadow-xl"><label className="block text-xs font-semibold text-stone-200">New {label}</label><input autoFocus value={name} onChange={(event) => onName(event.target.value)} placeholder={`${label} name`} className="mt-2 w-full rounded-lg border border-white/[.1] bg-[#101014] px-3 py-2 text-sm outline-none focus:border-stone-400" /><div className="mt-3 flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-xs text-stone-400 hover:bg-white/[.06]">Cancel</button><button disabled={!name.trim() || busy} className="rounded-lg bg-stone-200 px-3 py-2 text-xs font-semibold text-stone-900 hover:bg-white disabled:opacity-50">{busy ? "Creating…" : `Create ${label}`}</button></div>{error && <p className="mt-2 text-xs text-red-300">{error}</p>}</form>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-5" role="dialog" aria-modal="true" aria-label={title} onMouseDown={onClose}><div className="w-full max-w-sm rounded-2xl border border-white/[.12] bg-[#17171b] p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><h3 className="text-base font-semibold">{title}</h3><div className="mt-4">{children}</div></div></div>; }

function MembersPanel({ spaceId, canManage, ownRole, onBack, onLeaveSpace, onViewProfile }: { spaceId: string | null; canManage: boolean; ownRole: "owner" | "admin" | "member" | null; onBack: () => void; onLeaveSpace: () => Promise<void>; onViewProfile: (userId: string) => void }) {
  const [members, setMembers] = useState<SpaceMember[] | null>(null);
  const [invites, setInvites] = useState<SpaceInvite[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = () => {
    if (!spaceId) return;
    void listSpaceMembers(spaceId)
      .then(({ members: items }) => setMembers(items))
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load members."));
    if (canManage) {
      void listInvites(spaceId)
        .then(({ invites: items }) => setInvites(items))
        .catch(() => setInvites([]));
    }
  };
  useEffect(load, [spaceId, canManage]);
  const setRole = async (userId: string, role: "admin" | "member") => {
    if (!spaceId) return;
    setBusy(true);
    setError(null);
    try {
      await changeMemberRole(spaceId, userId, role);
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update the member.");
    } finally {
      setBusy(false);
    }
  };
  const kick = async (userId: string) => {
    if (!spaceId) return;
    setBusy(true);
    setError(null);
    try {
      await kickMember(spaceId, userId);
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove the member.");
    } finally {
      setBusy(false);
    }
  };
  const leave = async () => {
    setBusy(true);
    setError(null);
    try {
      await onLeaveSpace();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not leave this space.");
      setBusy(false);
    }
  };
  const loadInvites = () => {
    if (!spaceId) return;
    void listInvites(spaceId)
      .then(({ invites: items }) => setInvites(items))
      .catch(() => setInvites([]));
  };
  const createNewInvite = async () => {
    if (!spaceId) return;
    setBusy(true);
    setError(null);
    try {
      await createInvite(spaceId);
      loadInvites();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create an invite.");
    } finally {
      setBusy(false);
    }
  };
  const revoke = async (inviteId: string) => {
    setBusy(true);
    setError(null);
    try {
      await revokeInvite(inviteId);
      loadInvites();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not revoke the invite.");
    } finally {
      setBusy(false);
    }
  };
  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // clipboard access can be denied — the code is visible to copy manually
    }
  };
  return <div className="flex h-full flex-col"><div className="border-b border-white/[.06] px-5 py-4"><button onClick={onBack} className="text-xs font-semibold text-stone-400 hover:text-white">← Back to space</button><h2 className="mt-2 text-base font-semibold">Members</h2></div>{error && <p className="mx-5 mt-3 text-sm text-red-300">{error}</p>}<div className="flex-1 space-y-1 overflow-y-auto p-5 text-sm">{members === null && !error && <p className="text-stone-400">Loading members…</p>}{members?.map((member) => <div key={member.user_id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-white/[.04]"><button onClick={() => onViewProfile(member.user_id)} className="flex min-w-0 items-center gap-2 rounded-lg text-left hover:text-stone-200"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-violet-400 text-[9px] font-bold text-violet-950">{initials(member.display_name)}</span><div className="min-w-0"><p className="truncate text-sm text-stone-100">{member.display_name}</p><p className="truncate text-xs text-stone-500">@{member.username} · {member.role}</p></div></button>{canManage && member.role !== "owner" && <div className="flex shrink-0 items-center gap-1"><select value={member.role} disabled={busy} onChange={(event) => void setRole(member.user_id, event.target.value as "admin" | "member")} className="rounded-md border border-white/[.12] bg-[#101014] px-1.5 py-1 text-xs text-stone-200 outline-none"><option value="member">member</option><option value="admin">admin</option></select><button disabled={busy} onClick={() => void kick(member.user_id)} className="rounded-md p-1.5 text-stone-500 hover:bg-red-400/10 hover:text-red-300" aria-label={`Remove ${member.display_name}`}><Trash2 size={13} /></button></div>}</div>)}{canManage && <section className="mt-6"><div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.16em] text-stone-600">Invite links</span><button disabled={busy} onClick={() => void createNewInvite()} className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold text-stone-400 hover:bg-white/[.06] hover:text-stone-100 disabled:opacity-50"><Plus size={12} /> New invite</button></div>{invites?.length === 0 && <p className="text-xs text-stone-500">No active invites. Create one to bring people in.</p>}{invites?.map((invite) => <div key={invite.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-white/[.04]"><div className="min-w-0"><p className="truncate font-mono text-xs text-stone-100">{invite.code}</p><p className="text-xs text-stone-500">{invite.uses_count} used{invite.max_uses ? ` of ${invite.max_uses}` : ""}{invite.expires_at ? ` · expires ${new Date(invite.expires_at).toLocaleDateString()}` : ""}</p></div><div className="flex shrink-0 items-center gap-1"><button onClick={() => void copyCode(invite.code)} className="rounded-md p-1.5 text-stone-500 hover:bg-white/[.08] hover:text-stone-100" aria-label={`Copy invite code ${invite.code}`}><Copy size={13} /></button><button disabled={busy} onClick={() => void revoke(invite.id)} className="rounded-md p-1.5 text-stone-500 hover:bg-red-400/10 hover:text-red-300" aria-label={`Revoke invite ${invite.code}`}><Trash2 size={13} /></button></div></div>)}</section>}</div>{ownRole && ownRole !== "owner" && <div className="border-t border-white/[.06] p-5"><button disabled={busy} onClick={() => void leave()} className="w-full rounded-lg border border-red-400/30 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/10 disabled:opacity-50">Leave this space</button></div>}</div>;
}
function SettingsPanel({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void getMe()
      .then(({ user }) => {
        setProfile(user);
        setDisplayName(user.display_name);
        setUsername(user.username);
        setBio(user.bio ?? "");
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load your profile."));
  }, []);
  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSaveState("saving");
    setError(null);
    try {
      const { user } = await updateProfile({ display_name: displayName.trim(), username: username.trim(), bio: bio.trim() });
      setProfile(user);
      setDisplayName(user.display_name);
      setUsername(user.username);
      setBio(user.bio ?? "");
      setSaveState("saved");
    } catch (cause) {
      setSaveState("idle");
      setError(cause instanceof Error ? cause.message : "Could not save your profile.");
      return;
    }
    window.setTimeout(() => setSaveState("idle"), 2_000);
  };
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // the session is being discarded locally regardless of the server result
    }
    localStorage.removeItem("kivo_access_token");
    getRealtimeSocket()?.disconnect();
    navigate("/login");
  };
  return <div className="flex h-full flex-col"><div className="border-b border-white/[.06] px-5 py-4"><button onClick={onBack} className="text-xs font-semibold text-stone-400 hover:text-white">← Back to space</button><h2 className="mt-2 text-base font-semibold">Settings</h2></div><div className="flex-1 space-y-4 overflow-y-auto p-5 text-sm">{error && <p className="text-sm text-red-300">{error}</p>}{profile && <form onSubmit={saveProfile} className="rounded-xl border border-white/[.08] p-4"><p className="font-medium">Profile</p><p className="mt-1 text-xs text-stone-500">{profile.email}</p><label className="mt-3 block text-xs font-medium text-stone-400">Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-white/[.1] bg-[#101014] px-3 py-2 text-sm text-stone-100 outline-none focus:border-stone-400" /></label><label className="mt-3 block text-xs font-medium text-stone-400">Username<input value={username} onChange={(event) => setUsername(event.target.value)} className="mt-1.5 w-full rounded-lg border border-white/[.1] bg-[#101014] px-3 py-2 text-sm text-stone-100 outline-none focus:border-stone-400" /></label><label className="mt-3 block text-xs font-medium text-stone-400">Bio<textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={3} maxLength={255} placeholder="Tell people a little about yourself" className="mt-1.5 w-full resize-none rounded-lg border border-white/[.1] bg-[#101014] px-3 py-2 text-sm text-stone-100 outline-none focus:border-stone-400" /></label><button disabled={saveState === "saving" || !displayName.trim() || !username.trim()} className="mt-4 w-full rounded-lg bg-stone-200 px-3 py-2 text-xs font-semibold text-stone-900 hover:bg-white disabled:opacity-50">{saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : "Save changes"}</button></form>}<div className="rounded-xl border border-white/[.08] p-4"><p className="font-medium">Notifications</p><p className="mt-1 text-xs text-stone-500">Notification preferences will appear here.</p></div><div className="rounded-xl border border-white/[.08] p-4"><p className="font-medium">Session</p><p className="mt-1 text-xs text-stone-500">Log out of Kivo on this device.</p><button onClick={() => void handleLogout()} disabled={loggingOut} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-red-400/30 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"><LogOut size={14} /> {loggingOut ? "Logging out…" : "Log out"}</button></div></div></div>;
}
