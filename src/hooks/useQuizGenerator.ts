"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  GenerationMode,
  GenerationStatus,
  GenerateQuizRequest,
} from "@/types/quiz";

interface GenerationState {
  status: "idle" | "generating" | "complete" | "error";
  progress: number;
  questionSetId: string | null;
  error: string | null;
}

export function useQuizGenerator() {
  const [state, setState] = useState<GenerationState>({
    status: "idle",
    progress: 0,
    questionSetId: null,
    error: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getAccessToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("No active session");
    return data.session.access_token;
  }, []);

  const generate = useCallback(
    async (request: GenerateQuizRequest) => {
      setState({
        status: "generating",
        progress: 0,
        questionSetId: null,
        error: null,
      });

      try {
        const token = await getAccessToken();
        const res = await fetch("/api/quiz/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...request, accessToken: token }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Failed to generate quiz");
        }

        const { questionSetId } = await res.json();

        // Start polling
        return new Promise<string>((resolve, reject) => {
          let attempts = 0;
          const maxAttempts = 60;
          const pollInterval = setInterval(async () => {
            attempts++;
            try {
              const pollRes = await fetch(
                `/api/quiz/generate/${questionSetId}/status?accessToken=${encodeURIComponent(token)}`,
              );
              if (!pollRes.ok) return;
              const data = await pollRes.json();
              setState((prev) => ({
                ...prev,
                progress: data.progress,
              }));

              if (data.status === "complete") {
                clearInterval(pollInterval);
                setState({
                  status: "complete",
                  progress: 100,
                  questionSetId,
                  error: null,
                });
                resolve(questionSetId);
              } else if (data.status === "error") {
                clearInterval(pollInterval);
                setState({
                  status: "error",
                  progress: 0,
                  questionSetId: null,
                  error: data.error ?? "Generation failed",
                });
                reject(new Error(data.error ?? "Generation failed"));
              }
            } catch {
              if (attempts >= maxAttempts) {
                clearInterval(pollInterval);
                setState({
                  status: "error",
                  progress: 0,
                  questionSetId: null,
                  error: "Timed out waiting for generation",
                });
                reject(new Error("Timed out"));
              }
            }
          }, 2000);

          intervalRef.current = pollInterval;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to generate quiz";
        setState({ status: "error", progress: 0, questionSetId: null, error: message });
        throw err;
      }
    },
    [getAccessToken],
  );

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState({ status: "idle", progress: 0, questionSetId: null, error: null });
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { ...state, generate, reset };
}
