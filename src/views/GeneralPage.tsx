"use client";

import { PageShell } from "@/components/app/PageShell";
import { PageHeader } from "@/components/app/PageHeader";
import { AgentPanel } from "@/components/agent/AgentPanel";

export function GeneralPage() {
  return (
    <PageShell maxWidth="full" padded={false}>
      <div className="flex flex-col h-full min-h-0">
        <div
          className="animate-slide-up px-6 pt-8"
          style={{ animationFillMode: "backwards" }}
        >
          <PageHeader
            title="AI Agent"
            description="Your general study assistant — create subjects, topics, notes, materials, schedule reviews, search content, and generate AI descriptions."
          />
        </div>
        <div className="flex-1 px-6 pb-8 pt-4">
          <AgentPanel context="general" variant="page" />
        </div>
      </div>
    </PageShell>
  );
}
