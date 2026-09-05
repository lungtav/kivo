import { apiRequest } from "./api";

export type Space = {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
};

export type Channel = {
  id: string;
  name: string;
  category_id: string | null;
  position: number;
  unread_count: number;
};

export type ChannelGroup = {
  id: string;
  name: string;
  position: number;
  channels: Channel[];
};

export type SpaceStructure = Space & {
  role: "owner" | "admin" | "member";
  categories: ChannelGroup[];
  uncategorized_channels: Channel[];
};

export type MessageReply = {
  id: string;
  author: string | null;
  content: string | null;
  type: string;
  isDeleted: boolean;
};

export type MessageAttachment = {
  id: string;
  mediaType: string;
  mimeType: string;
  fileSizeBytes: number | null;
};

export type ApiMessage = {
  id: string;
  conversation_id: string;
  content: string | null;
  created_at: string;
  edited_at?: string | null;
  sender_id: string;
  sender_display_name: string | null;
  sender_username: string | null;
  deleted_at?: string | null;
  reply_to?: MessageReply | null;
  attachments?: MessageAttachment[];
};

export type SpaceMember = {
  user_id: string;
  role: "owner" | "admin" | "member";
  display_name: string;
  username: string;
  avatar_url: string | null;
};

export type DirectConversation = {
  id: string;
  type: "dm" | "group_dm";
  name: string | null;
  peer_id: string | null;
  peer_display_name: string | null;
  peer_username: string | null;
  peer_avatar_url: string | null;
  member_count: number;
  unread_count: number;
};

export type SpaceInvite = {
  id: string;
  space_id: string;
  code: string;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export type Peer = {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
};

export const conversationDisplayName = (conversation: DirectConversation) =>
  conversation.type === "dm"
    ? conversation.peer_display_name ?? conversation.peer_username ?? "Unknown user"
    : conversation.name ?? "Group";

export const listSpaces = () => apiRequest<{ spaces: Space[] }>("/api/spaces");
export const getSpace = (spaceId: string) => apiRequest<{ space: SpaceStructure }>(`/api/spaces/${spaceId}`);
export const getMessages = (conversationId: string, params?: { before?: string; limit?: number }) => {
  const search = new URLSearchParams();
  if (params?.before) search.set("before", params.before);
  if (params?.limit) search.set("limit", String(params.limit));
  const query = search.toString();
  return apiRequest<{ messages: ApiMessage[]; nextCursor: string | null }>(`/api/messages/${conversationId}${query ? `?${query}` : ""}`);
};
export const sendMessage = (conversationId: string, content: string, options?: { attachments?: { storageKey: string; mimeType: string; fileSizeBytes: number }[]; replyToId?: string }) => apiRequest<{ messageSent: ApiMessage }>(`/api/messages/${conversationId}`, { method: "POST", body: JSON.stringify({ content, ...(options?.attachments?.length ? { attachments: options.attachments } : {}), ...(options?.replyToId ? { replyToId: options.replyToId } : {}) }) });
export const requestUploadUrl = (mimeType: string) => apiRequest<{ uploadUrl: string; storageKey: string }>("/api/attachments/upload-url", { method: "POST", body: JSON.stringify({ mimeType }) });
export const uploadToStorage = async (uploadUrl: string, file: File) => {
  const response = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  if (!response.ok) throw new Error("The file could not be uploaded. Try again.");
};
export const getAttachmentReadUrl = (attachmentId: string) => apiRequest<{ readUrl: string }>(`/api/attachments/${attachmentId}/url`);
export const editMessage = (messageId: string, content: string) => apiRequest<{ messageUpdated: ApiMessage }>(`/api/messages/${messageId}`, { method: "PATCH", body: JSON.stringify({ content }) });
export const deleteMessage = (messageId: string) => apiRequest<void>(`/api/messages/${messageId}`, { method: "DELETE" });
export const markConversationRead = (conversationId: string) => apiRequest<void>(`/api/messages/${conversationId}/read`, { method: "POST" });
export const searchMessages = (conversationId: string, query: string) => apiRequest<{ results: { id: string; conversation_id: string; content: string | null; created_at: string; sender_display_name: string | null; sender_username: string | null }[] }>(`/api/messages/${conversationId}/search?q=${encodeURIComponent(query)}`);
export const joinChannel = (channelId: string) => apiRequest<{ message: string }>(`/api/channel/${channelId}/join`, { method: "POST" });
export const createCategory = (spaceId: string, name: string) => apiRequest<{ category: ChannelGroup }>(`/api/spaces/${spaceId}/categories`, { method: "POST", body: JSON.stringify({ name }) });
export const createChannel = (spaceId: string, name: string, categoryId?: string) => apiRequest<{ channel: Channel }>(`/api/spaces/${spaceId}/channels`, { method: "POST", body: JSON.stringify({ name, ...(categoryId ? { categoryId } : {}) }) });
export const createSpace = (name: string) => apiRequest<{ space: Space }>("/api/spaces", { method: "POST", body: JSON.stringify({ name }) });
export const deleteSpace = (spaceId: string) => apiRequest<void>(`/api/spaces/${spaceId}`, { method: "DELETE" });
export const deleteCategory = (categoryId: string) => apiRequest<void>(`/api/spaces/categories/${categoryId}`, { method: "DELETE" });
export const deleteChannel = (channelId: string) => apiRequest<void>(`/api/channel/${channelId}`, { method: "DELETE" });
export const listSpaceMembers = (spaceId: string) => apiRequest<{ members: SpaceMember[] }>(`/api/spaces/${spaceId}/members`);
export const changeMemberRole = (spaceId: string, userId: string, role: "admin" | "member") => apiRequest<{ member: SpaceMember }>(`/api/spaces/${spaceId}/members/${userId}`, { method: "PATCH", body: JSON.stringify({ role }) });
export const kickMember = (spaceId: string, userId: string) => apiRequest<void>(`/api/spaces/${spaceId}/members/${userId}`, { method: "DELETE" });
export const leaveSpace = (spaceId: string) => apiRequest<void>(`/api/spaces/${spaceId}/leave`, { method: "POST" });
export const createInvite = (spaceId: string) => apiRequest<{ invite: SpaceInvite }>(`/api/spaces/${spaceId}/invites`, { method: "POST", body: JSON.stringify({}) });
export const listInvites = (spaceId: string) => apiRequest<{ invites: SpaceInvite[] }>(`/api/spaces/${spaceId}/invites`);
export const revokeInvite = (inviteId: string) => apiRequest<void>(`/api/spaces/invites/${inviteId}`, { method: "DELETE" });
export const joinSpaceByCode = (code: string) => apiRequest<{ result: { spaceId: string } }>(`/api/spaces/join/${encodeURIComponent(code)}`, { method: "POST" });

export type UserProfile = {
  id: string;
  email: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  bio?: string | null;
  created_at?: string;
};

export type CommonSpace = {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
};

export type CommonGroup = {
  id: string;
  name: string;
  member_count: number;
};

export type ProfilePayload = {
  user: UserProfile;
  commonSpaces: CommonSpace[];
  commonGroups: CommonGroup[];
  directConversationId: string | null;
};

export const getMe = () => apiRequest<{ user: UserProfile }>("/api/me");
export const getProfile = (userId: string) => apiRequest<ProfilePayload>(`/api/users/${userId}`);
export const updateProfile = (input: { display_name?: string; username?: string; avatar_url?: string; bio?: string }) => apiRequest<{ user: UserProfile }>("/api/me", { method: "PATCH", body: JSON.stringify(input) });
export const listConversations = () => apiRequest<{ conversations: DirectConversation[] }>("/api/conversations");
export const listPeers = () => apiRequest<{ peers: Peer[] }>("/api/conversations/peers");
export const searchUsers = (query: string) => apiRequest<{ peers: Peer[] }>(`/api/users/search?q=${encodeURIComponent(query)}`);
export const createDirectMessage = (userId: string) => apiRequest<{ conversation: DirectConversation }>("/api/conversations", { method: "POST", body: JSON.stringify({ type: "dm", userId }) });
export const createGroupConversation = (name: string, memberIds: string[]) => apiRequest<{ conversation: DirectConversation }>("/api/conversations", { method: "POST", body: JSON.stringify({ type: "group_dm", name, memberIds }) });
