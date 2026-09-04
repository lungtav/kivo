import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import {
  getSpace,
  listSpaces,
  listConversations,
  createDirectMessage,
  createCategory,
  createChannel,
  createSpace,
  conversationDisplayName,
  deleteCategory,
  deleteChannel,
  deleteSpace,
  leaveSpace,
  joinSpaceByCode,
  type Channel,
  type DirectConversation,
  type Space,
  type SpaceStructure,
} from "../../lib/workspace";

export type SelectedConversation = {
  id: string;
  name: string;
  kind: "channel" | "direct";
};

type WorkspaceShellProps = {
  children: (props: {
    view: "home" | "space";
    selectedSpace: Space | null;
    selectedChannel: SelectedConversation | null;
    refreshConversations: () => void;
    onConversationActivity: (conversationId: string, kind: "read" | "new") => void;
  }) => ReactNode;
};

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  const location = useLocation();
  // deep-link handoff from the profile page: open a specific space or conversation once
  const pendingState = location.state as { spaceId?: string; conversationId?: string } | null;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [view, setView] = useState<"home" | "space">("space");
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [space, setSpace] = useState<SpaceStructure | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [selectedDirectId, setSelectedDirectId] = useState<string | null>(null);

  useEffect(() => {
    void listSpaces()
      .then(({ spaces: userSpaces }) => {
        setSpaces(userSpaces);
        const preferred = pendingState?.spaceId && userSpaces.some((item) => item.id === pendingState.spaceId)
          ? pendingState.spaceId
          : userSpaces[0]?.id ?? null;
        setSelectedSpaceId(preferred);
        if (pendingState?.spaceId) setView("space");
      })
      .catch(() => setSpaces([]));
    void listConversations()
      .then(({ conversations: items }) => {
        setConversations(items);
        if (pendingState?.conversationId && items.some((item) => item.id === pendingState.conversationId)) {
          setSelectedDirectId(pendingState.conversationId);
          setSelectedChannelId(null);
          setView("home");
        }
      })
      .catch(() => setConversations([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedSpaceId) {
      setSpace(null);
      setSelectedChannelId(null);
      setSelectedDirectId(null);
      return;
    }

    setSpace(null);
    setSelectedChannelId(null);
    setSelectedDirectId(null);
    void getSpace(selectedSpaceId)
      .then(({ space: selectedSpace }) => {
        setSpace(selectedSpace);
        setSelectedChannelId(
          selectedSpace.categories.flatMap((group) => group.channels)[0]?.id
            ?? selectedSpace.uncategorized_channels[0]?.id
            ?? null,
        );
      })
      .catch(() => setSpace(null));
  }, [selectedSpaceId]);

  const channels = space
    ? [...space.categories.flatMap((group) => group.channels), ...space.uncategorized_channels]
    : [];
  const channel = channels.find((item) => item.id === selectedChannelId) ?? null;
  const direct = conversations.find((item) => item.id === selectedDirectId) ?? null;
  const selectedChannel: SelectedConversation | null = view === "home"
    ? direct
      ? { id: direct.id, name: conversationDisplayName(direct), kind: "direct" }
      : null
    : channel
      ? { id: channel.id, name: channel.name, kind: "channel" }
      : null;
  const selectedSpace = spaces.find((item) => item.id === selectedSpaceId) ?? null;

  const selectSpace = (id: string) => {
    setView("space");
    setSelectedSpaceId(id);
  };

  const selectHome = () => {
    setView("home");
    setSelectedChannelId(null);
  };

  const selectChannel = (id: string) => {
    setSelectedDirectId(null);
    setSelectedChannelId(id);
  };

  const selectDirect = (id: string) => {
    setSelectedChannelId(null);
    setSelectedDirectId(id);
  };

  const addCategory = async (name: string) => {
    if (!selectedSpaceId) return;
    await createCategory(selectedSpaceId, name);
    const { space: refreshedSpace } = await getSpace(selectedSpaceId);
    setSpace(refreshedSpace);
  };

  const addChannel = async (name: string, categoryId: string | null) => {
    if (!selectedSpaceId) return;
    const { channel } = await createChannel(selectedSpaceId, name, categoryId ?? undefined);
    const { space: refreshedSpace } = await getSpace(selectedSpaceId);
    setSpace(refreshedSpace);
    setSelectedChannelId(channel.id);
  };

  const addSpace = async (name: string) => {
    const { space: newSpace } = await createSpace(name);
    setSpaces((items) => [newSpace, ...items]);
    setSelectedSpaceId(newSpace.id);
  };

  const addDirect = async (userId: string) => {
    const { conversation } = await createDirectMessage(userId);
    setConversations((items) => [conversation, ...items.filter((item) => item.id !== conversation.id)]);
    setSelectedDirectId(conversation.id);
    setSelectedChannelId(null);
  };

  const removeChannel = async (channelId: string) => {
    await deleteChannel(channelId);
    if (!selectedSpaceId) return;
    const { space: refreshedSpace } = await getSpace(selectedSpaceId);
    setSpace(refreshedSpace);
    setSelectedChannelId(refreshedSpace.categories.flatMap((group) => group.channels)[0]?.id ?? refreshedSpace.uncategorized_channels[0]?.id ?? null);
  };

  const removeCategory = async (categoryId: string) => {
    await deleteCategory(categoryId);
    if (!selectedSpaceId) return;
    const { space: refreshedSpace } = await getSpace(selectedSpaceId);
    setSpace(refreshedSpace);
  };

  const removeSpace = async () => {
    if (!selectedSpaceId) return;
    await deleteSpace(selectedSpaceId);
    const { spaces: updatedSpaces } = await listSpaces();
    setSpaces(updatedSpaces);
    setSelectedSpaceId(updatedSpaces[0]?.id ?? null);
  };

  const leaveCurrentSpace = async () => {
    if (!selectedSpaceId) return;
    await leaveSpace(selectedSpaceId);
    const { spaces: updatedSpaces } = await listSpaces();
    setSpaces(updatedSpaces);
    setSelectedSpaceId(updatedSpaces[0]?.id ?? null);
  };

  const joinWithCode = async (code: string) => {
    const { result } = await joinSpaceByCode(code);
    const { spaces: updatedSpaces } = await listSpaces();
    setSpaces(updatedSpaces);
    setSelectedSpaceId(result.spaceId);
  };

  const refreshConversations = () => {
    void listConversations()
      .then(({ conversations: items }) => setConversations(items))
      .catch(() => {});
  };

  // keep channel unread badges live: "new" bumps a non-open channel, "read" clears it
  const onConversationActivity = (conversationId: string, kind: "read" | "new") => {
    setSpace((prev) => {
      if (!prev) return prev;
      const apply = (channel: Channel) =>
        channel.id !== conversationId ? channel : { ...channel, unread_count: kind === "read" ? 0 : (channel.unread_count ?? 0) + 1 };
      return {
        ...prev,
        categories: prev.categories.map((group) => ({ ...group, channels: group.channels.map(apply) })),
        uncategorized_channels: prev.uncategorized_channels.map(apply),
      };
    });
  };

  return (
    <main className="flex h-svh overflow-hidden bg-background">
      <WorkspaceSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((open) => !open)}
        spaces={spaces}
        space={space}
        selectedSpaceId={selectedSpaceId}
        selectedChannelId={selectedChannelId}
        onSelectSpace={selectSpace}
        onSelectChannel={selectChannel}
        view={view}
        onSelectHome={selectHome}
        directMessages={conversations}
        selectedDirectId={selectedDirectId}
        onSelectDirect={selectDirect}
        onCreateDirect={addDirect}
        onCreateCategory={addCategory}
        onCreateChannel={addChannel}
        onCreateSpace={addSpace}
        onDeleteChannel={removeChannel}
        onDeleteCategory={removeCategory}
        onDeleteSpace={removeSpace}
        onLeaveSpace={leaveCurrentSpace}
        onJoinSpace={joinWithCode}
      />
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {children({ view, selectedSpace, selectedChannel, refreshConversations, onConversationActivity })}
      </section>
    </main>
  );
}
