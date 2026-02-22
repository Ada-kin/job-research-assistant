'use client';

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { NewAppSidebar } from '@/components/new-ui/app-sidebar';

export function NewAppLayoutShell({
  children,
  userEmail,
  headerActions
}: {
  children: React.ReactNode;
  userEmail: string;
  headerActions?: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <NewAppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-12 items-center border-b px-4 gap-3">
            <SidebarTrigger />
            <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">JobPilot</span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{userEmail}</span>
              {headerActions}
            </div>
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
