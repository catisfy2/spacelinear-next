"use client";

import { useEffect, useRef, useCallback } from "react";

/** Shape of quiz state persisted to sessionStorage for reload recovery. */
export interface PersistedQuizState {
  sessionId: string;
  currentIndex: number;
  answeredCount: number;
  timeLimitMinutes: number;
  timeRemaining: number;
  elapsedSeconds?: number;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    difficulty: string;
    tags: string[];
  }>;
}

/**
 * Persist quiz state to sessionStorage, restore it on page reload, and
 * automatically dismiss the quiz on SPA navigation away.
 *
 * @param storageKey - Unique sessionStorage key for this quiz type.
 * @param mode       - Logical mode identifier (e.g. "quick-practice").
 * @param phase      - Current component phase ("active" = quiz in progress).
 * @param sessionId  - Current quiz session ID.
 * @param currentState - State snapshot to persist (null when not active).
 * @param onSpaNavigate - Callback fired when SPA navigation is detected.
 * @returns An object with loadSaved (to restore) and clearSaved (to clean up).
 */
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
        JSON.stringify({
          ...currentState,
          mode,
          path: window.location.pathname,
        }),
      );
    }
  }, [phase, currentState, sessionId, storageKey, mode]);

  // Detect SPA navigation via effect cleanup (runs on unmount, not on dep change)
  useEffect(() => {
    return () => {
      const isReload =
        sessionStorage.getItem(storageKey + "-reloading") === "1";
      if (!isReload && phaseRef.current === "active" && sessionIdRef.current) {
        sessionStorage.removeItem(storageKey);
        onSpaNavigateRef.current();
      }
      sessionStorage.removeItem(storageKey + "-reloading");
    };
  }, [storageKey]);

  /** Restore a previously persisted quiz state, or null if none/expired. */
  const loadSaved = useCallback((): PersistedQuizState | null => {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      if (
        !data ||
        typeof data !== "object" ||
        data.path !== window.location.pathname ||
        data.mode !== mode ||
        !Array.isArray(data.questions) ||
        !Number.isInteger(data.currentIndex) ||
        !Number.isInteger(data.answeredCount) ||
        !Number.isInteger(data.timeLimitMinutes) ||
        !Number.isInteger(data.timeRemaining) ||
        typeof data.sessionId !== "string"
      ) {
        sessionStorage.removeItem(storageKey);
        return null;
      }
      const {
        questions,
        currentIndex,
        answeredCount,
        timeLimitMinutes,
        timeRemaining,
        elapsedSeconds,
        sessionId,
      } = data;
      return {
        questions,
        currentIndex,
        answeredCount,
        timeLimitMinutes,
        timeRemaining,
        elapsedSeconds: elapsedSeconds ?? 0,
        sessionId,
      };
    } catch {
      sessionStorage.removeItem(storageKey);
      return null;
    }
  }, [storageKey, mode]);

  /** Remove the persisted quiz state from sessionStorage. */
  const clearSaved = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    sessionStorage.removeItem(storageKey + "-reloading");
  }, [storageKey]);

  return { loadSaved, clearSaved };
}
