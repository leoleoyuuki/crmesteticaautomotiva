'use client';

import * as React from 'react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { SearchProvider } from '@/context/search-provider';

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
    <SearchProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-col h-screen">
              <AppHeader />
              <main className="flex-1 bg-background overflow-y-auto">
                <div className="p-4 sm:p-6 lg:p-8 mx-auto max-w-[1440px]">
                  {children}
                </div>
              </main>
            </div>
          </SidebarInset>
      </SidebarProvider>
    </SearchProvider>
  );
}
