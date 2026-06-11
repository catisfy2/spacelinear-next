"use client";

import { useState } from "react";
import { useDocsAdmin } from "@/hooks/useDocsAdmin";
import { PageShell } from "@/components/app/PageShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisibilityPanel } from "@/components/docs-admin/VisibilityPanel";
import { SectionsManager } from "@/components/docs-admin/SectionsManager";
import { TeamManager } from "@/components/docs-admin/TeamManager";
import { ChangelogManager } from "@/components/docs-admin/ChangelogManager";

export function DocsManagePage() {
  const {
    admin,
    sections,
    team,
    changelog,
    visibility,
    loading,
    reorderSections,
    updateSection,
    deleteSection,
    createSection,
    updateVisibility,
    updateTeamMember,
    deleteTeamMember,
    createTeamMember,
    createChangelog,
    deleteChangelog,
  } = useDocsAdmin();

  const [activeTab, setActiveTab] = useState("visibility");

  if (loading) {
    return (
      <PageShell>
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted" />
          <div className="h-96 animate-pulse rounded-lg bg-muted" />
        </div>
      </PageShell>
    );
  }

  if (!admin) {
    return (
      <PageShell>
        <PageHeader
          title="Access Denied"
          description="You do not have admin permissions to manage the docs."
        />
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="full">
      <PageHeader
        title="Docs Management"
        description="Manage documentation, visibility, team, and changelog."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="mb-6">
          <TabsTrigger value="visibility">Visibility</TabsTrigger>
          <TabsTrigger value="sections">Sections ({sections.length})</TabsTrigger>
          <TabsTrigger value="team">Team ({team.length})</TabsTrigger>
          <TabsTrigger value="changelog">Changelog ({changelog.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="visibility">
          <VisibilityPanel
            visibility={visibility}
            onUpdate={updateVisibility}
            docsUrl={typeof window !== "undefined" ? `${window.location.origin}/docs` : "/docs"}
          />
        </TabsContent>

        <TabsContent value="sections">
          <SectionsManager
            sections={sections}
            onReorder={reorderSections}
            onUpdate={updateSection}
            onDelete={deleteSection}
            onCreate={createSection}
          />
        </TabsContent>

        <TabsContent value="team">
          <TeamManager
            team={team}
            onUpdate={updateTeamMember}
            onDelete={deleteTeamMember}
            onCreate={createTeamMember}
          />
        </TabsContent>

        <TabsContent value="changelog">
          <ChangelogManager
            entries={changelog}
            onCreate={createChangelog}
            onDelete={deleteChangelog}
          />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
