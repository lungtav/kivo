import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Hash, Pin, Search, Users } from "lucide-react";
import { MessageComposer } from "../components/app/MessageComposer";
import { MessageItem, type Message } from "../components/app/MessageItem";
import { WorkspaceShell } from "../components/app/WorkspaceShell";
import { getMessages, joinChannel, sendMessage, type ApiMessage, type Channel } from "../lib/workspace";
import { ApiError } from "../lib/api";
import { connectRealtime, getRealtimeSocket } from "../lib/realtime";

type TypingUser = { userId: string; displayName: string; avatarUrl: string | null };

const currentUserId = () => {
  try {
    const token = localStorage.getItem("kivo_access_token");
    const payload = token && JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as { sub?: string };
    return payload?.sub ?? null;
  } catch {
    return null;
  }
};

const toMessage = (message: ApiMessage): Message => {
  const author = message.sender_display_name ?? message.sender_username ?? "Unknown user";
  return {
    id: message.id,
    author,
    initials: author.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    timestamp: new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(message.created_at)),
    body: message.content ?? "",
    accent: "violet",
    isOwn: message.sender_id === currentUserId(),
  };
};

export default function WorkspacePage() {
  return <WorkspaceShell>{(props) => <WorkspaceContent {...props} />}</WorkspaceShell>;
}

function WorkspaceContent({ selectedChannel }: { selectedChannel: Channel | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingUser>>({});
  const [isOnline, setIsOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeouts = useRef<Record<string, number>>({});
  const ownTypingTimeout = useRef<number | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    const socket = connectRealtime();
    const onConnect = () => setIsOnline(true);
    const onDisconnect = () => setIsOnline(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    if (socket.connected) setIsOnline(true);
    const heartbeat = window.setInterval(() => socket.emit("heartbeat"), 20_000);
    return () => { socket.off("connect", onConnect); socket.off("disconnect", onDisconnect); window.clearInterval(heartbeat); };
  }, []);

  useEffect(() => {
      if (!selectedChannel) {
        setMessages([]);
        return;
      }
      let active = true;
      setLoadingMessages(true);
      setMessagesError(null);
      setMessages([]);
      const conversationId = selectedChannel.id;
      const load = () => getMessages(conversationId).then(({ messages: items }) => { if (active) setMessages(items.map(toMessage)); });
      void load()
        .catch(async (error: unknown) => {
          // channels are opt-in for regular members — a 404 means we haven't joined yet
          if (!active || !(error instanceof ApiError) || error.code !== "NOT_FOUND") throw error;
          await joinChannel(conversationId);
          getRealtimeSocket()?.emit("conversation:join", { conversationId });
          await load();
        })
        .catch((error: unknown) => { if (active) setMessagesError(error instanceof Error ? error.message : "Could not load messages."); })
        .finally(() => { if (active) setLoadingMessages(false); });
      return () => { active = false; };
  }, [selectedChannel?.id]);

  useEffect(() => {
    if (!selectedChannel) return;
    const socket = connectRealtime();
    const conversationId = selectedChannel.id;
    socket.emit("conversation:join", { conversationId });
    const refreshMessages = () => void getMessages(conversationId).then(({ messages: items }) => setMessages(items.map(toMessage)));
    const onMessage = (message: ApiMessage) => { if (message.conversation_id === conversationId) refreshMessages(); };
    const onTyping = (payload: { userId: string; conversationId: string; user: { displayName: string; avatarUrl: string | null }; isTyping: boolean }) => {
      if (payload.conversationId !== conversationId || payload.userId === currentUserId()) return;
      if (typingTimeouts.current[payload.userId]) window.clearTimeout(typingTimeouts.current[payload.userId]);
      if (!payload.isTyping) { setTypingUsers((users) => { const { [payload.userId]: _, ...rest } = users; return rest; }); return; }
      setTypingUsers((users) => ({ ...users, [payload.userId]: { userId: payload.userId, displayName: payload.user.displayName, avatarUrl: payload.user.avatarUrl } }));
      typingTimeouts.current[payload.userId] = window.setTimeout(() => setTypingUsers((users) => { const { [payload.userId]: _, ...rest } = users; return rest; }), 1_800);
    };
    socket.on("message:new", onMessage);
    socket.on("typing:update", onTyping);
    return () => { socket.off("message:new", onMessage); socket.off("typing:update", onTyping); setTypingUsers({}); };
  }, [selectedChannel?.id]);

  const addMessage = async (body: string) => {
    if (!selectedChannel) return;
    const socket = getRealtimeSocket();
    if (socket?.connected) {
      await new Promise<void>((resolve, reject) => socket.emit("message:send", { conversationId: selectedChannel.id, content: body }, (result: { status: string; message?: string }) => result.status === "ok" ? resolve() : reject(new Error(result.message ?? "Message could not be sent."))));
    } else await sendMessage(selectedChannel.id, body);
    const { messages: items } = await getMessages(selectedChannel.id);
    setMessages(items.map(toMessage));
  };

  const handleTyping = useCallback((typing: boolean) => {
    setIsTyping(typing);
    if (!selectedChannel) return;
    const socket = getRealtimeSocket();
    if (!socket?.connected) return;
    if (ownTypingTimeout.current) window.clearTimeout(ownTypingTimeout.current);
    socket.emit(typing ? "typing:start" : "typing:stop", { conversationId: selectedChannel.id });
    if (typing) ownTypingTimeout.current = window.setTimeout(() => socket.emit("typing:stop", { conversationId: selectedChannel.id }), 1_200);
  }, [selectedChannel?.id]);

  const typers = Object.values(typingUsers);
  return <div className="flex min-h-0 flex-1 overflow-hidden bg-[#17171b] text-stone-100"><section className="flex min-w-0 flex-1 flex-col"><header className="flex h-auto min-h-14 shrink-0 items-center justify-between border-b border-white/[.06] bg-[#1b1b20] px-5 py-2.5 shadow-sm"><div className="flex min-w-0 items-center gap-3"><Hash size={19} className="text-stone-400" /><div><h1 className="truncate text-sm font-semibold text-stone-100">{selectedChannel?.name ?? "Select a channel"}</h1>{selectedChannel && <p className={`mt-0.5 flex items-center gap-1.5 text-[11px] ${isOnline ? "text-emerald-300/80" : "text-stone-500"}`}><span className={`size-1.5 rounded-full ${isOnline ? "bg-emerald-400" : "bg-stone-600"}`} /> {isOnline ? "Live" : "Reconnecting…"} · members with access can view this channel</p>}</div></div><div className="flex items-center gap-1"><HeaderButton label="Pinned messages"><Pin size={17} /></HeaderButton><HeaderButton label="Notifications"><Bell size={17} /></HeaderButton><HeaderButton label="Search"><Search size={17} /></HeaderButton><button className="ml-1 grid size-8 place-items-center rounded-lg text-stone-400 hover:bg-white/[.07] hover:text-stone-100" aria-label="People"><Users size={17} /></button></div></header><div className="flex min-h-0 flex-1 flex-col"><div className="flex-1 overflow-y-auto overscroll-contain bg-[#17171b] px-5 py-6 [scrollbar-width:thin] [scrollbar-color:#444_#17171b]"><div className="mx-auto max-w-4xl"><div className="mb-6 flex items-center gap-3"><div className="h-px flex-1 bg-white/[.07]" /><span className="text-[10px] font-semibold uppercase tracking-[.16em] text-stone-500">Today</span><div className="h-px flex-1 bg-white/[.07]" /></div>{loadingMessages && <p className="text-sm text-stone-500">Loading messages…</p>}{messagesError && <p role="alert" className="text-sm text-red-300">{messagesError}</p>}{!loadingMessages && !messagesError && messages.length === 0 && selectedChannel && <p className="text-sm text-stone-500">No messages yet. Start the conversation.</p>}<div className="space-y-1">{messages.map((message) => <MessageItem key={message.id} message={message} />)}</div><div ref={messagesEndRef} /></div></div>{selectedChannel && <><TypingIndicator users={typers} ownTyping={isTyping} /><MessageComposer channel={selectedChannel.name} onSend={addMessage} onTyping={handleTyping} /></>}</div></section></div>;
}

function TypingIndicator({ users, ownTyping }: { users: TypingUser[]; ownTyping: boolean }) { if (!users.length && !ownTyping) return <div className="h-7" />; const names = users.map((user) => user.displayName).join(", "); return <div className="mx-auto flex h-7 w-full max-w-4xl items-center gap-2 px-5 text-xs text-stone-400"><div className="flex -space-x-2">{users.slice(0, 3).map((user) => user.avatarUrl ? <img key={user.userId} src={user.avatarUrl} alt="" className="size-5 rounded-full border-2 border-[#1b1b20] object-cover" /> : <span key={user.userId} className="grid size-5 place-items-center rounded-full border-2 border-[#1b1b20] bg-violet-400 text-[8px] font-bold text-violet-950">{user.displayName.slice(0, 1).toUpperCase()}</span>)}</div><span>{users.length ? `${names}${users.length > 3 ? ` and ${users.length - 3} more` : ""} ${users.length === 1 ? "is" : "are"} typing…` : "You are typing…"}</span></div>; }

function HeaderButton({ label, children }: { label: string; children: React.ReactNode }) {
  return <button aria-label={label} className="grid size-8 place-items-center rounded-lg text-stone-500 hover:bg-white/[.07] hover:text-stone-100">{children}</button>;
}
