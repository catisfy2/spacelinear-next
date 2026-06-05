"use client";

import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import { useEffect, useRef, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function DataLoader({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { fetchAll, clear, loading } = useStore();
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    if (userId && userId !== prevUserId.current) {
      prevUserId.current = userId;
      fetchAll(userId);
    } else if (!userId && prevUserId.current) {
      prevUserId.current = null;
      clear();
    }
  }, [userId, fetchAll, clear]);

  if (user && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
