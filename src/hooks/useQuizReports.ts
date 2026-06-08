"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DailyReport, WeeklyReport, TopicGap } from "@/types/quiz";

async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("No active session");
  return data.session.access_token;
}

export function useDailyReport(date?: string) {
  return useQuery({
    queryKey: ["quiz-daily-report", date],
    queryFn: async (): Promise<DailyReport> => {
      const token = await getAccessToken();
      const params = new URLSearchParams({ accessToken: token });
      if (date) params.set("date", date);
      const res = await fetch(`/api/quiz/reports/daily?${params}`);
      if (!res.ok) throw new Error("Failed to fetch daily report");
      return res.json();
    },
  });
}

export function useWeeklyReport(weekEnd?: string) {
  return useQuery({
    queryKey: ["quiz-weekly-report", weekEnd],
    queryFn: async (): Promise<WeeklyReport> => {
      const token = await getAccessToken();
      const params = new URLSearchParams({ accessToken: token });
      if (weekEnd) params.set("weekEnd", weekEnd);
      const res = await fetch(`/api/quiz/reports/weekly?${params}`);
      if (!res.ok) throw new Error("Failed to fetch weekly report");
      return res.json();
    },
  });
}

export function useGapAnalysis() {
  return useQuery({
    queryKey: ["quiz-gap-analysis"],
    queryFn: async (): Promise<{ gaps: TopicGap[] }> => {
      const token = await getAccessToken();
      const res = await fetch(
        `/api/quiz/reports/gaps?accessToken=${encodeURIComponent(token)}`,
      );
      if (!res.ok) throw new Error("Failed to fetch gap analysis");
      return res.json();
    },
  });
}
