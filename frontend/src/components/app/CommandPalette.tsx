import { useEffect, useMemo, useRef, useState } from "react";
import { Hash, MessageCircle, Search, User } from "lucide-react";
import { listPeers, searchUsers, type DirectConversation, type Peer, type Space, type SpaceStructure } from "../../lib/workspace";

type PaletteItem =
  | { kind: "space"; id: string; label: string }
  | { kind: "channel"; id: string; label: string; spaceId: string; spaceName: string }
  | { kind: "dm"; id: string; label: string; peerId?: string }
  | { kind: "person"; id: string; label: string; username: string };

type Group = { title: string; items: PaletteItem[] };

type Props = {
  onClose: () => void;
  spaces: Space[];
  space: SpaceStructure | null;
  conversations: DirectConversation[];
  onSelectSpace: (id: string) => void;
  onOpenChannel: (spaceId: string, channelId: string) => void;
  onSelectDirect: (id: string) => void;
  onCreateDirect: (userId: string) => Promise<void>;
  onViewProfile: (userId: string) => void;
};

const initials = (name: string) => name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();

export function CommandPalette({ onClose, spaces, space, conversations, onSelectSpace, onOpenChannel, onSelectDirect, onCreateDirect, onViewProfile }: Props) {
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<Peer[] | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();

  const channels = useMemo(
    () => (space ? [...space.categories.flatMap((group) => group.channels.map((channel) => ({ ...channel, spaceId: space.id, spaceName: space.name }))), ...space.uncategorized_channels.map((channel) => ({ ...channel, spaceId: space.id, spaceName: space.name }))] : []),
    [space],
  );

  // people come from the search API for real queries, from your peers otherwise
  useEffect(() => {
    if (trimmed.length < 2) {
      setPeople(null);
      return;
    }
    const timer = window.setTimeout(() => {
      void searchUsers(trimmed)
        .then(({ peers }) => setPeople(peers))
        .catch(() => setPeople([]));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [trimmed]);

  useEffect(() => {
    void listPeers()
      .then(({ peers }) => setPeople((current) => current ?? peers.slice(0, 8)))
      .catch(() => {});
  }, []);

  const groups: Group[] = useMemo(() => {
    const match = (label: string) => !lower || label.toLowerCase().includes(lower);
    const groups: Group[] = [];
    const spaceItems: PaletteItem[] = spaces.filter((item) => match(item.name)).map((item) => ({ kind: "space", id: item.id, label: item.name }));
    const channelItems: PaletteItem[] = channels.filter((channel) => match(channel.name)).map((channel) => ({ kind: "channel", id: channel.id, label: channel.name, spaceId: channel.spaceId, spaceName: channel.spaceName }));
    const dmItems: PaletteItem[] = conversations.filter((dm) => match(dm.name ?? "") || match(dm.peer_display_name ?? "") || match(dm.peer_username ?? "")).map((dm) => ({ kind: "dm", id: dm.id, label: dm.name ?? dm.peer_display_name ?? dm.peer_username ?? "Direct message", peerId: dm.peer_id ?? undefined }));
    if (spaceItems.length) groups.push({ title: "Spaces", items: spaceItems });
    if (channelItems.length) groups.push({ title: "Channels", items: channelItems });
    if (dmItems.length) groups.push({ title: "Direct messages", items: dmItems });
    if (people) {
      const personItems: PaletteItem[] = people.filter((peer) => match(peer.display_name) || match(peer.username)).map((peer) => ({ kind: "person", id: peer.id, label: peer.display_name, username: peer.username }));
      if (personItems.length) groups.push({ title: "People", items: personItems });
    }
    return groups;
  }, [spaces, channels, conversations, people, lower]);

  const flat = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  useEffect(() => { setActive(0); }, [query]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const execute = (item: PaletteItem) => {
    onClose();
    if (item.kind === "space") onSelectSpace(item.id);
    if (item.kind === "channel") onOpenChannel(item.spaceId, item.id);
    if (item.kind === "dm") onSelectDirect(item.id);
    if (item.kind === "person") void onCreateDirect(item.id);
  };

  const runAtIndex = (index: number) => {
    const item = flat[index];
    if (item) execute(item);
  };

  const iconFor = (item: PaletteItem) => {
    if (item.kind === "space") return <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary text-[8px] font-bold text-primary-foreground">{initials(item.label)}</span>;
    if (item.kind === "channel") return <Hash size={14} className="shrink-0 text-muted-foreground" />;
    if (item.kind === "dm") return <MessageCircle size={14} className="shrink-0 text-muted-foreground" />;
    return <User size={14} className="shrink-0 text-muted-foreground" />;
  };

  let runningIndex = -1;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Quick navigation" onMouseDown={onClose}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search size={16} className="shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") { event.preventDefault(); onClose(); }
              if (event.key === "ArrowDown") { event.preventDefault(); setActive((index) => Math.min(index + 1, flat.length - 1)); }
              if (event.key === "ArrowUp") { event.preventDefault(); setActive((index) => Math.max(index - 1, 0)); }
              if (event.key === "Enter") { event.preventDefault(); runAtIndex(active); }
            }}
            placeholder="Jump to a space, channel, conversation or person…"
            className="w-full bg-transparent py-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">esc</kbd>
        </div>
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {flat.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted-foreground">{trimmed.length >= 2 && people !== null ? "Nothing matches that search." : "Type to search spaces, channels and people."}</p>}
          {groups.map((group) => (
            <div key={group.title} className="mb-1">
              <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground/70">{group.title}</p>
              {group.items.map((item) => {
                runningIndex += 1;
                const index = runningIndex;
                return (
                  <button
                    key={`${item.kind}-${item.id}`}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => runAtIndex(index)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm ${index === active ? "bg-foreground/5 text-foreground" : "text-muted-foreground"}`}
                  >
                    {iconFor(item)}
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.kind === "person" && <span className="shrink-0 text-xs text-muted-foreground/70">@{item.username}</span>}
                    {item.kind === "channel" && <span className="shrink-0 text-xs text-muted-foreground/70">{item.spaceName}</span>}
                    {item.kind === "person" && trimmed.length >= 2 && (
                      <span className="shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground" onMouseDown={(event) => { event.stopPropagation(); onViewProfile(item.id); }}>Profile</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
