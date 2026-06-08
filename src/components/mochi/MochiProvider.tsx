"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface MochiContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  unreadCount: number;
  proactiveMessage: string | null;
  clearProactive: () => void;
  greeting: string;
}

const MochiContext = createContext<MochiContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
  unreadCount: 0,
  proactiveMessage: null,
  clearProactive: () => {},
  greeting: "",
});

export function useMochi() {
  return useContext(MochiContext);
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

const greetings = [
  "Hey! Ready to study?",
  "Let's learn something new!",
  "How's your focus today?",
  "Time to level up!",
  "What should we tackle?",
];

export function MochiProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [proactiveMessage, setProactiveMessage] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("");
  const notifiedIds = useRef(new Set<string>());

  useEffect(() => {
    setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
  }, []);

  const { data: alerts } = useQuery({
    queryKey: ["mochi-alerts"],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) return { events: [] };
      const res = await fetch(
        `/api/mochi/alerts?accessToken=${encodeURIComponent(token)}`,
      );
      if (!res.ok) return { events: [] };
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const unreadAlerts = (alerts?.events ?? []).filter(
    (e: { id: string }) => !notifiedIds.current.has(e.id),
  );

  useEffect(() => {
    if (unreadAlerts.length > 0 && !isOpen) {
      const latest = unreadAlerts[unreadAlerts.length - 1] as {
        id: string;
        event_type: string;
      };
      notifiedIds.current.add(latest.id);
      const msg =
        latest.event_type === "quiz_completed"
          ? "Your quiz results are in! Want to review?"
          : latest.event_type === "study_committed"
            ? "Nice study session! Keep it going?"
            : "I've got something for you!";
      setProactiveMessage(msg);
    }
  }, [unreadAlerts, isOpen]);

  const clearProactive = useCallback(() => {
    setProactiveMessage(null);
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  return (
    <MochiContext.Provider
      value={{
        isOpen,
        open,
        close,
        toggle,
        unreadCount: unreadAlerts.length,
        proactiveMessage,
        clearProactive,
        greeting,
      }}
    >
      {children}
    </MochiContext.Provider>
  );
}
