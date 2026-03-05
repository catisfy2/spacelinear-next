"use client";

import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import { useEffect, useRef, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function DataLoader({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { fetchAll, clear, loading } = useStore();
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    if (user && user.id !== prevUserId.current) {
      prevUserId.current = user.id;
      fetchAll(user.id);
    } else if (!user && prevUserId.current) {
      prevUserId.current = null;
      clear();
    }
  }, [user, fetchAll, clear]);

  if (user && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
