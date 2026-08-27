import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Hash,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import kivoLogo from "../../assets/kivo-logo.jfif";

const spaces = [
  { name: "Design team", initials: "DT" },
  { name: "Product launch", initials: "PL" },
  { name: "Company HQ", initials: "HQ" },
];
const groups = [
  { name: "Planning", channels: ["sprint-planning", "roadmap"] },
  { name: "Design", channels: ["design-review", "research"] },
];
const uncategorized = ["general", "announcements", "random"];
type Props = {
  isOpen: boolean;
  onToggle: () => void;
  selectedSpace: string;
  selectedChannel: string;
  onSelectSpace: (space: string) => void;
  onSelectChannel: (channel: string) => void;
};

export function WorkspaceSidebar({
  isOpen,
  onToggle,
  selectedSpace,
  selectedChannel,
  onSelectSpace,
  onSelectChannel,
}: Props) {
  return (
    <aside className="flex h-full shrink-0 overflow-hidden bg-[#101014] text-stone-100">
      <nav className="flex h-full w-[72px] flex-col items-center gap-2 border-r border-white/[.06] bg-[#0b0b0e] py-3">
        <button
          className="mb-1 grid size-11 place-items-center rounded-xl"
          aria-label="Kivo home"
        >
          <img
            src={kivoLogo}
            alt=""
            className="size-7 rounded-lg object-contain grayscale opacity-70"
          />
        </button>
        <button
          onClick={onToggle}
          className="mb-1 grid size-11 place-items-center rounded-xl text-stone-500 hover:bg-white/[.07] hover:text-stone-100"
          aria-label={isOpen ? "Close channel sidebar" : "Open channel sidebar"}
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
        {spaces.map((space) => (
          <button
            key={space.name}
            title={space.name}
            onClick={() => onSelectSpace(space.name)}
            className={`grid size-11 place-items-center rounded-xl border text-[10px] font-bold transition ${selectedSpace === space.name ? "border-stone-300 bg-stone-200 text-stone-900" : "border-white/[.08] bg-[#17171c] text-stone-500 hover:border-white/25 hover:bg-[#202026] hover:text-stone-100"}`}
          >
            {space.initials}
          </button>
        ))}
        <button
          className="grid size-11 place-items-center rounded-xl border border-dashed border-white/15 text-stone-500 hover:border-stone-400 hover:text-stone-100"
          aria-label="Add a space"
        >
          <Plus size={19} />
        </button>
        <button
          className="mt-auto grid size-11 place-items-center rounded-xl text-stone-500 hover:bg-white/[.07] hover:text-stone-100"
          aria-label="Settings"
        >
          <Settings size={19} />
        </button>
      </nav>
      <div
        className={`overflow-hidden transition-[width,opacity] duration-200 ${isOpen ? "w-72 opacity-100" : "w-0 opacity-0"}`}
      >
        <div className="flex h-full w-72 flex-col bg-[#121217]">
          <div className="border-b border-white/[.06] bg-[#16161b] px-4 py-4">
            <button className="flex w-full items-center justify-between text-left">
              <span>
                <span className="block text-[10px] font-semibold uppercase tracking-[.18em] text-stone-500">
                  Space
                </span>
                <span className="mt-1 block text-[15px] font-semibold text-stone-100">
                  {selectedSpace}
                </span>
              </span>
              <ChevronDown size={17} className="text-stone-500" />
            </button>
            <div className="mt-4 flex items-center gap-2">
              <button
                title="People"
                className="grid size-9 place-items-center rounded-lg border border-white/[.1] text-stone-400 hover:bg-white/[.08] hover:text-stone-100"
                aria-label="People"
              >
                <Users size={16} />
              </button>
              <button
                title="Create channel"
                className="grid size-9 place-items-center rounded-lg bg-stone-200 text-stone-900 hover:bg-white"
                aria-label="Create channel"
              >
                <Plus size={17} />
              </button>
              <span className="ml-auto text-xs text-stone-500">12 people</span>
            </div>
          </div>
          <div className="flex-1 px-3 py-5">
            {groups.map((group) => (
              <ChannelGroup
                key={group.name}
                {...group}
                selected={selectedChannel}
                onSelect={onSelectChannel}
              />
            ))}
            <ChannelGroup
              name="Uncategorised"
              channels={uncategorized}
              selected={selectedChannel}
              onSelect={onSelectChannel}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
function ChannelGroup({
  name,
  channels,
  selected,
  onSelect,
}: {
  name: string;
  channels: string[];
  selected: string;
  onSelect: (channel: string) => void;
}) {
  return (
    <div className="mb-5">
      <div className="mb-1.5 flex items-center justify-between px-2">
        <span className="text-[10px] font-bold uppercase tracking-[.17em] text-stone-600">
          {name}
        </span>
        <button
          className="text-stone-600 hover:text-stone-100"
          aria-label={`Add to ${name}`}
        >
          <Plus size={14} />
        </button>
      </div>
      {channels.map((channel) => (
        <button
          key={channel}
          onClick={() => onSelect(channel)}
          className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${selected === channel ? "bg-stone-200 text-stone-900" : "text-stone-500 hover:bg-white/[.07] hover:text-stone-200"}`}
        >
          <Hash
            size={16}
            className={
              selected === channel ? "text-stone-700" : "text-stone-600"
            }
          />
          <span className="truncate">{channel}</span>
        </button>
      ))}
    </div>
  );
}
