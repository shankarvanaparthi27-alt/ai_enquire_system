'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  toggleMobileOpen: () => void;
  setMobileOpen: (open: boolean) => void;
  activeFlyout: string | null;
  setActiveFlyout: (flyout: string | null) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  toggleCollapsed: () => {},
  setCollapsed: () => {},
  isMobileOpen: false,
  toggleMobileOpen: () => {},
  setMobileOpen: () => {},
  activeFlyout: null,
  setActiveFlyout: () => {},
});

const STORAGE_KEY = 'universe_ai_sidebar_collapsed';

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // Ignore
    }
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Ignore
      }
      return next;
    });
    // Close flyout on collapse change
    setActiveFlyout(null);
  };

  const setCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // Ignore
    }
  };

  const toggleMobileOpen = () => {
    setIsMobileOpen((prev) => !prev);
  };

  const setMobileOpen = (open: boolean) => {
    setIsMobileOpen(open);
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleCollapsed,
        setCollapsed,
        isMobileOpen,
        toggleMobileOpen,
        setMobileOpen,
        activeFlyout,
        setActiveFlyout,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
