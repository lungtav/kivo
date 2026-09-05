import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { AtSign, Hash, Phone, PhoneMissed, PhoneOff, Search, Settings, User, Users, Video, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MessageComposer } from "../components/app/MessageComposer";
import { MessageItem, type Message } from "../components/app/MessageItem";
import { WorkspaceShell, type SelectedConversation } from "../components/app/WorkspaceShell";
import { getMessages, joinChannel, sendMessage, requestUploadUrl, uploadToStorage, editMessage, deleteMessage, markConversationRead, searchMessages, getCallLogs, type ApiMessage, type CallLog } from "../lib/workspace";
import { ApiError } from "../lib/api";
import { connectRealtime, getRealtimeSocket } from "../lib/realtime";
import { callBus } from "../components/app/CallOverlay";

type TypingUser = { userId: string; displayName: string; avatarUrl: string | null };

const currentUserId = (): string | null => {
  try {
    const token = localStorage.getItem("kivo_access_token");
    if (!token) return null;
    const payload: { sub?: string } = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.sub ?? null;
  } catch {
    return null;
  }
};

const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const dayLabel = (date: Date) => {
  const now = new Date();
  if (isSameDay(date, now)) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Yesterday";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(date);
};

const toMessage = (message: ApiMessage): Message => {
  const author = message.sender_display_name ?? message.sender_username ?? "Unknown user";
  const replyTo = message.reply_to;
  const sentAt = new Date(message.created_at);
  const timestamp = isSameDay(sentAt, new Date())
    ? new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(sentAt)
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(sentAt);
  const deleted = !!message.deleted_at;
  return {
    id: message.id,
    author,
    initials: author.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    timestamp,
    body: message.content ?? "",
    accent: "violet",
    isOwn: message.sender_id === currentUserId(),
    authorId: message.sender_id,
    sentAt,
    edited: !!message.edited_at && !deleted,
    deleted,
    attachments: deleted ? undefined : message.attachments?.map(({ id, mediaType, mimeType }) => ({ id, mediaType, mimeType })),
    replyTo: deleted || !replyTo ? undefined : {
      id: replyTo.id,
      author: replyTo.author ?? "Unknown user",
      body: replyTo.isDeleted
        ? "Original message was deleted"
        : replyTo.content ?? (replyTo.type === "media" ? "Sent an attachment" : "Message"),
    },
  };
};

export default function WorkspacePage() {
  return <WorkspaceShell>{(props) => <WorkspaceContent {...props} />}</WorkspaceShell>;
}

function WorkspaceContent({ view, selectedChannel, refreshConversations, onConversationActivity, onOpenMembers, onPresence }: { view: "home" | "space"; selectedChannel: SelectedConversation | null; refreshConversations?: () => void; onConversationActivity?: (conversationId: string, kind: "read" | "new") => void; onOpenMembers?: () => void; onPresence?: (userId: string, online: boolean) => void }) {
  const navigate = useNavigate();
  const viewProfile = (userId: string) => navigate(`/app/profile/${userId}`);
  const [messages, setMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingUser>>({});
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  type MessageSearchResult = { id: string; content: string | null; created_at: string; sender_display_name: string | null; sender_username: string | null };
  const [searchResults, setSearchResults] = useState<MessageSearchResult[] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeouts = useRef<Record<string, number>>({});
  const ownTypingTimeout = useRef<number | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // live message search inside the open conversation
  const searchConversationId = selectedChannel?.id;
  useEffect(() => {
    if (!searchOpen || !searchConversationId) {
      setSearchResults(null);
      return;
    }
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults(null);
      return;
    }
    const timer = window.setTimeout(() => {
      void searchMessages(searchConversationId, query)
        .then(({ results }) => setSearchResults(results))
        .catch(() => setSearchResults([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery, searchOpen, searchConversationId]);

  const closeSearch = () => { setSearchOpen(false); setSearchQuery(""); setSearchResults(null); };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (searchOpen) { closeSearch(); return; }
      if (replyingTo) setReplyingTo(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, replyingTo]);

  useEffect(() => {
    const socket = connectRealtime();
    const onPresenceOnline = (payload: { userId: string }) => onPresence?.(payload.userId, true);
    const onPresenceOffline = (payload: { userId: string }) => onPresence?.(payload.userId, false);
    socket.on("presence:online", onPresenceOnline);
    socket.on("presence:offline", onPresenceOffline);
    const heartbeat = window.setInterval(() => socket.emit("heartbeat"), 20_000);
    return () => { socket.off("presence:online", onPresenceOnline); socket.off("presence:offline", onPresenceOffline); window.clearInterval(heartbeat); };
  }, []);

  useEffect(() => {
      if (!selectedChannel) {
        setMessages([]);
        setNextCursor(null);
        return;
      }
      let active = true;
      setLoadingMessages(true);
      setMessagesError(null);
      setMessages([]);
      setNextCursor(null);
      setReplyingTo(null);
      setCallLogs([]);
      const conversationId = selectedChannel.id;
      const load = () => getMessages(conversationId).then(({ messages: items, nextCursor: cursor }) => {
        if (!active) return;
        setMessages(items.map(toMessage));
        setNextCursor(cursor);
        void markConversationRead(conversationId).then(() => { refreshConversations?.(); onConversationActivity?.(conversationId, "read"); }).catch(() => {});
      });
      void getCallLogs(conversationId).then(({ calls }) => { if (active) setCallLogs(calls); }).catch(() => {});
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

  const appendMessage = (message: ApiMessage) => setMessages((current) => current.some((existing) => existing.id === message.id) ? current : [...current, toMessage(message)]);

  const markDeleted = (messageId: string) => setMessages((current) => current.map((existing) => existing.id === messageId ? { ...existing, deleted: true, body: "", attachments: undefined, replyTo: undefined } : existing));

  const loadOlder = async () => {
    if (!selectedChannel || !nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const { messages: items, nextCursor: cursor } = await getMessages(selectedChannel.id, { before: nextCursor });
      setMessages((current) => [...items.map(toMessage), ...current]);
      setNextCursor(cursor);
    } catch (error: unknown) {
      setMessagesError(error instanceof Error ? error.message : "Could not load earlier messages.");
    } finally {
      setLoadingOlder(false);
    }
  };

  useEffect(() => {
    if (!selectedChannel) return;
    const socket = connectRealtime();
    const conversationId = selectedChannel.id;
    let wasConnected = socket.connected;
    socket.emit("conversation:join", { conversationId });
    const refreshMessages = () => void getMessages(conversationId).then(({ messages: items, nextCursor: cursor }) => { setMessages(items.map(toMessage)); setNextCursor(cursor); });
    const onConnect = () => {
      // a reconnect (not the first connect, which the fetch effect covers) may have missed messages
      if (wasConnected) refreshMessages();
      wasConnected = true;
    };
    const onMessage = (message: ApiMessage) => {
      if (message.conversation_id !== conversationId) {
        // a channel we're not looking at — keep its unread badge honest
        onConversationActivity?.(message.conversation_id, "new");
        return;
      }
      appendMessage(message);
      if (document.visibilityState === "visible") {
        void markConversationRead(conversationId).then(() => { refreshConversations?.(); onConversationActivity?.(conversationId, "read"); }).catch(() => {});
      } else {
        onConversationActivity?.(conversationId, "new");
      }
    };
    const onMessageUpdate = (message: ApiMessage) => {
      if (message.conversation_id !== conversationId) return;
      setMessages((current) => current.map((existing) => existing.id === message.id ? toMessage(message) : existing));
    };
    const onCallLog = (payload: { log: CallLog }) => {
      if (payload.log.conversation_id !== conversationId) return;
      setCallLogs((current) => current.some((existing) => existing.id === payload.log.id) ? current : [payload.log, ...current]);
    };
    const onMessageDelete = (payload: { conversationId: string; messageId: string }) => {
      if (payload.conversationId !== conversationId) return;
      markDeleted(payload.messageId);
    };
    const onTyping = (payload: { userId: string; conversationId: string; user: { displayName: string; avatarUrl: string | null }; isTyping: boolean }) => {
      if (payload.conversationId !== conversationId || payload.userId === currentUserId()) return;
      if (typingTimeouts.current[payload.userId]) window.clearTimeout(typingTimeouts.current[payload.userId]);
      if (!payload.isTyping) { setTypingUsers((users) => { const { [payload.userId]: _, ...rest } = users; return rest; }); return; }
      setTypingUsers((users) => ({ ...users, [payload.userId]: { userId: payload.userId, displayName: payload.user.displayName, avatarUrl: payload.user.avatarUrl } }));
      typingTimeouts.current[payload.userId] = window.setTimeout(() => setTypingUsers((users) => { const { [payload.userId]: _, ...rest } = users; return rest; }), 1_800);
    };
    socket.on("connect", onConnect);
    socket.on("message:new", onMessage);
    socket.on("message:update", onMessageUpdate);
    socket.on("message:delete", onMessageDelete);
    socket.on("call:log", onCallLog);
    socket.on("typing:update", onTyping);
    return () => { socket.off("connect", onConnect); socket.off("message:new", onMessage); socket.off("message:update", onMessageUpdate); socket.off("message:delete", onMessageDelete); socket.off("call:log", onCallLog); socket.off("typing:update", onTyping); socket.emit("conversation:leave", { conversationId }); setTypingUsers({}); };
  }, [selectedChannel?.id]);

  const addMessage = async (body: string, files: File[] = []) => {
    if (!selectedChannel) return;
    const conversationId = selectedChannel.id;
    const replyToId = replyingTo?.id;
    const socket = getRealtimeSocket();
    let message: ApiMessage | undefined;
    if (files.length > 0) {
      // attachments can only go through REST — get a presigned URL per file, upload, then send
      const attachments = [];
      for (const file of files) {
        const { uploadUrl, storageKey } = await requestUploadUrl(file.type);
        await uploadToStorage(uploadUrl, file);
        attachments.push({ storageKey, mimeType: file.type, fileSizeBytes: file.size });
      }
      ({ messageSent: message } = await sendMessage(conversationId, body, { attachments, replyToId }));
    } else if (socket?.connected) {
      message = await new Promise<ApiMessage>((resolve, reject) => socket.emit("message:send", { conversationId, content: body, replyToId }, (result: { status: "ok"; message?: ApiMessage } | { status: "error"; message?: string }) => {
        if (result.status === "ok") {
          if (result.message) resolve(result.message);
          else reject(new Error("Message could not be sent."));
        } else reject(new Error(result.message ?? "Message could not be sent."));
      }));
    } else {
      ({ messageSent: message } = await sendMessage(conversationId, body, { replyToId }));
    }
    if (message) appendMessage(message);
    setReplyingTo(null);
  };

  const handleEdit = async (messageId: string, body: string) => {
    const { messageUpdated } = await editMessage(messageId, body);
    setMessages((current) => current.map((existing) => existing.id === messageId ? toMessage(messageUpdated) : existing));
  };

  const handleDelete = async (messageId: string) => {
    await deleteMessage(messageId);
    markDeleted(messageId);
  };

  const handleTyping = useCallback((typing: boolean) => {
    if (!selectedChannel) return;
    const socket = getRealtimeSocket();
    if (!socket?.connected) return;
    if (ownTypingTimeout.current) window.clearTimeout(ownTypingTimeout.current);
    socket.emit(typing ? "typing:start" : "typing:stop", { conversationId: selectedChannel.id });
    if (typing) ownTypingTimeout.current = window.setTimeout(() => socket.emit("typing:stop", { conversationId: selectedChannel.id }), 1_200);
  }, [selectedChannel?.id]);

  const typers = Object.values(typingUsers);
  const lastOwnMessage = selectedChannel?.kind === "direct" && selectedChannel.peerLastReadId
    ? [...messages].reverse().find((message) => message.isOwn && !message.deleted)
    : null;
  const seen = !!(lastOwnMessage && selectedChannel?.peerLastReadId === lastOwnMessage.id);
  return <div className="flex min-h-0 flex-1 overflow-hidden bg-background text-foreground"><section className="flex min-w-0 flex-1 flex-col"><header className="flex h-auto min-h-14 shrink-0 items-center justify-between border-b border-border bg-card px-5 py-2.5 shadow-sm"><div className="flex min-w-0 items-center gap-3">{selectedChannel?.kind === "direct" ? <AtSign size={19} className="text-muted-foreground" /> : <Hash size={19} className="text-muted-foreground" />}<div><h1 className="truncate text-sm font-semibold text-foreground">{selectedChannel?.name ?? (view === "home" ? "Select a conversation" : "Select a channel")}</h1></div></div><div className="flex items-center gap-1">{selectedChannel?.kind === "direct" && selectedChannel.peerId && <HeaderButton label="Start video call" onClick={() => callBus.startCall?.(selectedChannel.peerId!, selectedChannel.name, true)}><Video size={17} /></HeaderButton>}{selectedChannel && <HeaderButton label="Search messages" onClick={() => { setSearchOpen((open) => !open); setSearchQuery(""); setSearchResults(null); }}><Search size={17} /></HeaderButton>}{selectedChannel?.kind === "direct" && selectedChannel.peerId && <HeaderButton label="View profile" onClick={() => viewProfile(selectedChannel.peerId!)}><User size={17} /></HeaderButton>}{selectedChannel?.kind === "channel" && <HeaderButton label="Members" onClick={() => onOpenMembers?.()}><Users size={17} /></HeaderButton>}<HeaderButton label="Your profile and settings" onClick={() => { const userId = currentUserId(); if (userId) viewProfile(userId); }}><Settings size={17} /></HeaderButton></div></header>{searchOpen && selectedChannel && <div className="border-b border-border bg-card px-5 py-3"><div className="mx-auto flex max-w-4xl items-center gap-2"><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={`Search in ${selectedChannel.kind === "direct" ? "@" : "#"}${selectedChannel.name}`} className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:focus:border-neutral-600" /><button onClick={closeSearch} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground" aria-label="Close search"><X size={15} /></button></div>{searchResults && <div className="mx-auto mt-2 max-h-64 max-w-4xl divide-y divide-border overflow-y-auto rounded-xl border border-border bg-background shadow-sm">{searchResults.length === 0 && searchQuery.trim().length >= 2 && <p className="px-3 py-2.5 text-xs text-muted-foreground">No messages match “{searchQuery.trim()}”.</p>}{searchQuery.trim().length < 2 && <p className="px-3 py-2.5 text-xs text-muted-foreground">Type at least 2 characters.</p>}{searchResults.map((result) => <button key={result.id} onClick={() => { document.getElementById(`message-${result.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); closeSearch(); }} className="block w-full px-3 py-2 text-left hover:bg-foreground/5"><span className="text-xs font-semibold text-foreground">{result.sender_display_name ?? result.sender_username}</span><span className="ml-2 text-[10px] text-muted-foreground">{new Date(result.created_at).toLocaleString()}</span><p className="truncate text-xs text-muted-foreground">{result.content}</p></button>)}</div>}</div>}<div className="flex min-h-0 flex-1 flex-col"><div className="flex-1 overflow-y-auto overscroll-contain px-5 py-6"><div className="mx-auto max-w-4xl">{nextCursor && !loadingMessages && <div className="mb-4 flex justify-center"><button onClick={() => void loadOlder()} disabled={loadingOlder} className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground hover:bg-foreground/5 hover:text-foreground disabled:opacity-50">{loadingOlder ? "Loading…" : "Load earlier messages"}</button></div>}{loadingMessages && <p className="text-sm text-muted-foreground">Loading messages…</p>}{messagesError && <p role="alert" className="text-sm text-red-500">{messagesError}</p>}{!loadingMessages && !messagesError && messages.length === 0 && selectedChannel && <p className="text-sm text-muted-foreground">No messages yet. Start the conversation.</p>}<div className="space-y-1">{(() => { const timeline: ({ key: string; sentAt: Date; kind: "message"; message: Message } | { key: string; sentAt: Date; kind: "call"; log: CallLog })[] = [...callLogs.map((log) => ({ key: `call-${log.id}`, kind: "call" as const, log, sentAt: new Date(log.created_at) })), ...messages.map((message) => ({ key: message.id, kind: "message" as const, message, sentAt: message.sentAt }))].sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime()); return timeline.map((item, index) => { const previous = timeline[index - 1]; return <Fragment key={item.key}>{(!previous || !isSameDay(previous.sentAt, item.sentAt)) && <div className="mb-6 mt-2 flex items-center gap-3"><div className="h-px flex-1 bg-border" /><span className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">{dayLabel(item.sentAt)}</span><div className="h-px flex-1 bg-border" /></div>}{item.kind === "call" ? <CallEntry log={item.log} /> : <MessageItem message={item.message} onEdit={handleEdit} onDelete={handleDelete} onReply={setReplyingTo} />}</Fragment>; }); })()}{seen && <p className="pt-1 pr-1 text-right text-[10px] text-muted-foreground">Seen</p>}</div><div ref={messagesEndRef} /></div></div>{selectedChannel && <><TypingIndicator users={typers} /><MessageComposer channel={selectedChannel.name} channelIcon={selectedChannel.kind === "direct" ? "@" : "#"} draftKey={selectedChannel.id} replyTo={replyingTo ? { author: replyingTo.author, body: replyingTo.body } : null} onCancelReply={() => setReplyingTo(null)} onSend={addMessage} onTyping={handleTyping} /></>}</div></section></div>;
}

function CallEntry({ log }: { log: CallLog }) {
  const outgoing = log.caller_id === currentUserId();
  const durationSeconds = log.started_at && log.ended_at ? Math.max(1, Math.round((new Date(log.ended_at).getTime() - new Date(log.started_at).getTime()) / 1000)) : null;
  const formatDuration = (seconds: number) => seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;
  const statusText = log.status === "answered" ? (durationSeconds ? formatDuration(durationSeconds) : "") : log.status === "declined" ? "Declined" : log.status === "no_answer" ? "No answer" : log.status === "cancelled" ? "Cancelled" : "";
  const missed = log.status === "declined" || log.status === "no_answer" || log.status === "cancelled";
  const label = outgoing ? "Outgoing call" : "Incoming call";
  const Icon = log.status === "answered" ? Phone : missed && log.status !== "cancelled" ? PhoneMissed : PhoneOff;
  return <div className="flex justify-center py-1"><span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground"><Icon size={13} className={missed ? "text-red-500" : ""} /> {label}{statusText ? ` · ${statusText}` : ""}</span></div>;
}

function TypingIndicator({ users }: { users: TypingUser[] }) { if (!users.length) return <div className="h-7" />; const names = users.map((user) => user.displayName).join(", "); return <div className="mx-auto flex h-7 w-full max-w-4xl items-center gap-2 px-5 text-xs text-muted-foreground"><div className="flex -space-x-2">{users.slice(0, 3).map((user) => user.avatarUrl ? <img key={user.userId} src={user.avatarUrl} alt="" className="size-5 rounded-full border-2 border-background object-cover" /> : <span key={user.userId} className="grid size-5 place-items-center rounded-full border-2 border-background bg-muted text-[8px] font-bold text-muted-foreground">{user.displayName.slice(0, 1).toUpperCase()}</span>)}</div><span>{`${names}${users.length > 3 ? ` and ${users.length - 3} more` : ""} ${users.length === 1 ? "is" : "are"} typing…`}</span></div>; }

function HeaderButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return <button aria-label={label} onClick={onClick} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground">{children}</button>;
}
