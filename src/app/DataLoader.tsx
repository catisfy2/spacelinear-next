"use client";

import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import { useEffect, useRef, type ReactNode } from "react";

export function DataLoader({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { fetchAll, clear, loading } = useStore();
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    if (user && user.id !== prevUserId.current) {
      prevUserId.current = user.id;
      // Fire data fetch but don't block rendering
      fetchAll(user.id);
    } else if (!user && prevUserId.current) {
      prevUserId.current = null;
      clear();
    }
  }, [user, fetchAll, clear]);

  // Always render children immediately — no full-page spinner.
  // Individual pages handle their own empty/loading states.
  return <>{children}</>;
}
