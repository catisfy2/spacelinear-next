"use client";

import { useEffect, useRef, useCallback } from "react";

export interface PersistedQuizState {
  sessionId: string;
  currentIndex: number;
  answeredCount: number;
  timeLimitMinutes: number;
  timeRemaining: number;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    difficulty: string;
    tags: string[];
  }>;
}

export function useQuizPersistence(
  storageKey: string,
  mode: string,
  phase: string,
  sessionId: string | null,
  currentState: PersistedQuizState | null,
  onSpaNavigate: () => void,
) {
  const phaseRef = useRef(phase);
  const sessionIdRef = useRef(sessionId);
  const onSpaNavigateRef = useRef(onSpaNavigate);
  phaseRef.current = phase;
  sessionIdRef.current = sessionId;
  onSpaNavigateRef.current = onSpaNavigate;

  // beforeunload: show browser warning + mark reload flag
  useEffect(() => {
    if (phase !== "active") return;
    const handler = (e: BeforeUnloadEvent) => {
      sessionStorage.setItem(storageKey + "-reloading", "1");
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase, storageKey]);

  // Persist state whenever it changes during active phase
  useEffect(() => {
    if (phase === "active" && currentState && sessionId) {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({ ...currentState, mode, path: window.location.pathname }),
      );
    }
  }, [phase, currentState, sessionId, storageKey, mode]);

  // Detect SPA navigation via effect cleanup (runs on unmount, not on dep change)
  useEffect(() => {
    return () => {
      const isReload = sessionStorage.getItem(storageKey + "-reloading") === "1";
      if (!isReload && phaseRef.current === "active" && sessionIdRef.current) {
        sessionStorage.removeItem(storageKey);
        onSpaNavigateRef.current();
      }
      sessionStorage.removeItem(storageKey + "-reloading");
    };
  }, [storageKey]);

  const loadSaved = useCallback((): PersistedQuizState | null => {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      if (data.path === window.location.pathname && data.mode === mode) {
        const { questions, currentIndex, answeredCount, timeLimitMinutes, timeRemaining, sessionId } = data;
        return { questions, currentIndex, answeredCount, timeLimitMinutes, timeRemaining, sessionId };
      }
    } catch {}
    return null;
  }, [storageKey, mode]);

  const clearSaved = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    sessionStorage.removeItem(storageKey + "-reloading");
  }, [storageKey]);

  return { loadSaved, clearSaved };
}
