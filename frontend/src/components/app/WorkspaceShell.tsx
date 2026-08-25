import type { ReactNode } from "react";
import { WorkspaceSidebar } from "./WorkspaceSidebar";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  return <main className="flex min-h-svh bg-slate-50"><WorkspaceSidebar /><section className="flex min-w-0 flex-1 flex-col">{children}</section></main>;
}
