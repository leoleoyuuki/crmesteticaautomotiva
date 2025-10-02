'use client';

import * as React from 'react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [defaultOpen, setDefaultOpen] = React.useState(true);

  React.useEffect(() => {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('sidebar_state='))
      ?.split('=')[1];
    if (cookieValue) {
      setDefaultOpen(cookieValue === 'true');
    }
  }, []);

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-col h-screen">
            <AppHeader />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background overflow-y-auto">
              {children}
            </main>
          </div>
        </SidebarInset>
    </SidebarProvider>
  );
}
