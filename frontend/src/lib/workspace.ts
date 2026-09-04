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

export type ApiMessage = {
  id: string;
  conversation_id: string;
  content: string | null;
  created_at: string;
  sender_id: string;
  sender_display_name: string | null;
  sender_username: string | null;
};

export const listSpaces = () => apiRequest<{ spaces: Space[] }>("/api/spaces");
export const getSpace = (spaceId: string) => apiRequest<{ space: SpaceStructure }>(`/api/spaces/${spaceId}`);
export const getMessages = (conversationId: string) => apiRequest<{ messages: ApiMessage[] }>(`/api/messages/${conversationId}`);
export const sendMessage = (conversationId: string, content: string) => apiRequest<{ messageSent: ApiMessage }>(`/api/messages/${conversationId}`, { method: "POST", body: JSON.stringify({ content }) });
export const joinChannel = (channelId: string) => apiRequest<{ message: string }>(`/api/channel/${channelId}/join`, { method: "POST" });
export const createCategory = (spaceId: string, name: string) => apiRequest<{ category: ChannelGroup }>(`/api/spaces/${spaceId}/categories`, { method: "POST", body: JSON.stringify({ name }) });
export const createChannel = (spaceId: string, name: string, categoryId?: string) => apiRequest<{ channel: Channel }>(`/api/spaces/${spaceId}/channels`, { method: "POST", body: JSON.stringify({ name, ...(categoryId ? { categoryId } : {}) }) });
export const createSpace = (name: string) => apiRequest<{ space: Space }>("/api/spaces", { method: "POST", body: JSON.stringify({ name }) });
export const deleteSpace = (spaceId: string) => apiRequest<void>(`/api/spaces/${spaceId}`, { method: "DELETE" });
export const deleteCategory = (categoryId: string) => apiRequest<void>(`/api/spaces/categories/${categoryId}`, { method: "DELETE" });
export const deleteChannel = (channelId: string) => apiRequest<void>(`/api/channel/${channelId}`, { method: "DELETE" });
