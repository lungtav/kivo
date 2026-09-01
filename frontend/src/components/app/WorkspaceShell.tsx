import { useEffect, useState, type ReactNode } from "react";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import {
  getSpace,
  listSpaces,
  createCategory,
  createChannel,
  createSpace,
  deleteCategory,
  deleteChannel,
  deleteSpace,
  type Channel,
  type Space,
  type SpaceStructure,
} from "../../lib/workspace";

type WorkspaceShellProps = {
  children: (props: {
    selectedSpace: Space | null;
    selectedChannel: Channel | null;
  }) => ReactNode;
};

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [space, setSpace] = useState<SpaceStructure | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  useEffect(() => {
    void listSpaces()
      .then(({ spaces: userSpaces }) => {
        setSpaces(userSpaces);
        setSelectedSpaceId(userSpaces[0]?.id ?? null);
      })
      .catch(() => setSpaces([]));
  }, []);

  useEffect(() => {
    if (!selectedSpaceId) {
      setSpace(null);
      setSelectedChannelId(null);
      return;
    }

    setSpace(null);
    setSelectedChannelId(null);
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
  const selectedChannel = channels.find((channel) => channel.id === selectedChannelId) ?? null;
  const selectedSpace = spaces.find((item) => item.id === selectedSpaceId) ?? null;

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

  return (
    <main className="flex h-svh overflow-hidden bg-[#17171b]">
      <WorkspaceSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((open) => !open)}
        spaces={spaces}
        space={space}
        selectedSpaceId={selectedSpaceId}
        selectedChannelId={selectedChannelId}
        onSelectSpace={setSelectedSpaceId}
        onSelectChannel={setSelectedChannelId}
        onCreateCategory={addCategory}
        onCreateChannel={addChannel}
        onCreateSpace={addSpace}
        onDeleteChannel={removeChannel}
        onDeleteCategory={removeCategory}
        onDeleteSpace={removeSpace}
      />
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {children({ selectedSpace, selectedChannel })}
      </section>
    </main>
  );
}
