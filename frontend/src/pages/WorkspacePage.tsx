import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { AtSign, Bell, Hash, Pin, Search, Users } from "lucide-react";
import { MessageComposer } from "../components/app/MessageComposer";
import { MessageItem, type Message } from "../components/app/MessageItem";
import { WorkspaceShell, type SelectedConversation } from "../components/app/WorkspaceShell";
import { getMessages, joinChannel, sendMessage, requestUploadUrl, uploadToStorage, editMessage, deleteMessage, markConversationRead, type ApiMessage } from "../lib/workspace";
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

function WorkspaceContent({ view, selectedChannel, refreshConversations }: { view: "home" | "space"; selectedChannel: SelectedConversation | null; refreshConversations?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingUser>>({});
  const [isOnline, setIsOnline] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
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
        setNextCursor(null);
        return;
      }
      let active = true;
      setLoadingMessages(true);
      setMessagesError(null);
      setMessages([]);
      setNextCursor(null);
      setReplyingTo(null);
      const conversationId = selectedChannel.id;
      const load = () => getMessages(conversationId).then(({ messages: items, nextCursor: cursor }) => {
        if (!active) return;
        setMessages(items.map(toMessage));
        setNextCursor(cursor);
        void markConversationRead(conversationId).then(() => refreshConversations?.()).catch(() => {});
      });
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
      if (message.conversation_id !== conversationId) return;
      appendMessage(message);
      if (document.visibilityState === "visible") {
        void markConversationRead(conversationId).then(() => refreshConversations?.()).catch(() => {});
      }
    };
    const onMessageUpdate = (message: ApiMessage) => {
      if (message.conversation_id !== conversationId) return;
      setMessages((current) => current.map((existing) => existing.id === message.id ? toMessage(message) : existing));
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
    socket.on("typing:update", onTyping);
    return () => { socket.off("connect", onConnect); socket.off("message:new", onMessage); socket.off("message:update", onMessageUpdate); socket.off("message:delete", onMessageDelete); socket.off("typing:update", onTyping); socket.emit("conversation:leave", { conversationId }); setTypingUsers({}); };
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
    setIsTyping(typing);
    if (!selectedChannel) return;
    const socket = getRealtimeSocket();
    if (!socket?.connected) return;
    if (ownTypingTimeout.current) window.clearTimeout(ownTypingTimeout.current);
    socket.emit(typing ? "typing:start" : "typing:stop", { conversationId: selectedChannel.id });
    if (typing) ownTypingTimeout.current = window.setTimeout(() => socket.emit("typing:stop", { conversationId: selectedChannel.id }), 1_200);
  }, [selectedChannel?.id]);

  const typers = Object.values(typingUsers);
  return <div className="flex min-h-0 flex-1 overflow-hidden bg-[#17171b] text-stone-100"><section className="flex min-w-0 flex-1 flex-col"><header className="flex h-auto min-h-14 shrink-0 items-center justify-between border-b border-white/[.06] bg-[#1b1b20] px-5 py-2.5 shadow-sm"><div className="flex min-w-0 items-center gap-3">{selectedChannel?.kind === "direct" ? <AtSign size={19} className="text-stone-400" /> : <Hash size={19} className="text-stone-400" />}<div><h1 className="truncate text-sm font-semibold text-stone-100">{selectedChannel?.name ?? (view === "home" ? "Select a conversation" : "Select a channel")}</h1>{selectedChannel && <p className={`mt-0.5 flex items-center gap-1.5 text-[11px] ${isOnline ? "text-emerald-300/80" : "text-stone-500"}`}><span className={`size-1.5 rounded-full ${isOnline ? "bg-emerald-400" : "bg-stone-600"}`} /> {isOnline ? "Live" : "Reconnecting…"} · members with access can view this channel</p>}</div></div><div className="flex items-center gap-1"><HeaderButton label="Pinned messages"><Pin size={17} /></HeaderButton><HeaderButton label="Notifications"><Bell size={17} /></HeaderButton><HeaderButton label="Search"><Search size={17} /></HeaderButton><button className="ml-1 grid size-8 place-items-center rounded-lg text-stone-400 hover:bg-white/[.07] hover:text-stone-100" aria-label="People"><Users size={17} /></button></div></header><div className="flex min-h-0 flex-1 flex-col"><div className="flex-1 overflow-y-auto overscroll-contain bg-[#17171b] px-5 py-6 [scrollbar-width:thin] [scrollbar-color:#444_#17171b]"><div className="mx-auto max-w-4xl">{nextCursor && !loadingMessages && <div className="mb-4 flex justify-center"><button onClick={() => void loadOlder()} disabled={loadingOlder} className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-stone-400 hover:bg-white/[.06] hover:text-stone-200 disabled:opacity-50">{loadingOlder ? "Loading…" : "Load earlier messages"}</button></div>}{loadingMessages && <p className="text-sm text-stone-500">Loading messages…</p>}{messagesError && <p role="alert" className="text-sm text-red-300">{messagesError}</p>}{!loadingMessages && !messagesError && messages.length === 0 && selectedChannel && <p className="text-sm text-stone-500">No messages yet. Start the conversation.</p>}<div className="space-y-1">{messages.map((message, index) => { const previous = messages[index - 1]; return <Fragment key={message.id}>{(!previous || !isSameDay(previous.sentAt, message.sentAt)) && <div className="mb-6 mt-2 flex items-center gap-3"><div className="h-px flex-1 bg-white/[.07]" /><span className="text-[10px] font-semibold uppercase tracking-[.16em] text-stone-500">{dayLabel(message.sentAt)}</span><div className="h-px flex-1 bg-white/[.07]" /></div>}<MessageItem message={message} onEdit={handleEdit} onDelete={handleDelete} onReply={setReplyingTo} /></Fragment>; })}</div><div ref={messagesEndRef} /></div></div>{selectedChannel && <><TypingIndicator users={typers} ownTyping={isTyping} /><MessageComposer channel={selectedChannel.name} channelIcon={selectedChannel.kind === "direct" ? "@" : "#"} replyTo={replyingTo ? { author: replyingTo.author, body: replyingTo.body } : null} onCancelReply={() => setReplyingTo(null)} onSend={addMessage} onTyping={handleTyping} /></>}</div></section></div>;
}

function TypingIndicator({ users, ownTyping }: { users: TypingUser[]; ownTyping: boolean }) { if (!users.length && !ownTyping) return <div className="h-7" />; const names = users.map((user) => user.displayName).join(", "); return <div className="mx-auto flex h-7 w-full max-w-4xl items-center gap-2 px-5 text-xs text-stone-400"><div className="flex -space-x-2">{users.slice(0, 3).map((user) => user.avatarUrl ? <img key={user.userId} src={user.avatarUrl} alt="" className="size-5 rounded-full border-2 border-[#1b1b20] object-cover" /> : <span key={user.userId} className="grid size-5 place-items-center rounded-full border-2 border-[#1b1b20] bg-violet-400 text-[8px] font-bold text-violet-950">{user.displayName.slice(0, 1).toUpperCase()}</span>)}</div><span>{users.length ? `${names}${users.length > 3 ? ` and ${users.length - 3} more` : ""} ${users.length === 1 ? "is" : "are"} typing…` : "You are typing…"}</span></div>; }

function HeaderButton({ label, children }: { label: string; children: React.ReactNode }) {
  return <button aria-label={label} className="grid size-8 place-items-center rounded-lg text-stone-500 hover:bg-white/[.07] hover:text-stone-100">{children}</button>;
}
