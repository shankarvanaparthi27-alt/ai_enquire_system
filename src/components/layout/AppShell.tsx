'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from './AppSidebar';
import { Footer } from './Footer';
import { SidebarProvider } from '@/contexts/SidebarContext';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Route condition: Hide sidebar on homepage, auth pages, admin portal and institution portal
  const isHomepage = pathname === '/';
  const isChat = pathname.startsWith('/chat');
  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');
  const isAdminOrInstitution =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/institution-portal');

  if (isHomepage || isAuthPage) {
    return (
      <>
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </>
    );
  }

  if (isAdminOrInstitution) {
    return <main className="flex-1 flex flex-col">{children}</main>;
  }

  if (isChat) {
    return (
      <SidebarProvider>
        <div className="flex-1 flex w-full relative h-[calc(100vh-4rem)] overflow-hidden">
          <AppSidebar />
          <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
            {children}
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex-1 flex w-full relative min-h-[calc(100vh-4rem)]">
        {/* Animated Collapsible Sidebar filling all the way to the end */}
        <AppSidebar />

        {/* Content Container with Footer docked at the bottom of the content column */}
        <main className="flex-1 min-w-0 flex flex-col transition-all duration-300">
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
        </main>
      </div>
    </SidebarProvider>
  );
}
