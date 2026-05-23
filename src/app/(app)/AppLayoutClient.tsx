"use client";

import { useState } from "react";
import { DataLoader } from "../DataLoader";
import { AppShell } from "@/components/shell/AppShell";
import { CoachPanel } from "@/components/coach/CoachPanel";

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const [coachOpen, setCoachOpen] = useState(false);

  return (
    <>
      <DataLoader>
        <AppShell onOpenCoach={() => setCoachOpen(true)}>{children}</AppShell>
      </DataLoader>
      <CoachPanel open={coachOpen} onOpenChange={setCoachOpen} />
    </>
  );
}
