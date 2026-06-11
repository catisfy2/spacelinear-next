"use client";

import { useState, useEffect, useMemo } from "react";
import { useDocs } from "@/hooks/useDocs";
import { DocsUnavailable } from "./DocsUnavailable";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { SidebarNav } from "@/components/docs/SidebarNav";
import { SectionRenderer } from "@/components/docs/SectionRenderer";
import { SearchDialog } from "@/components/docs/SearchDialog";
import { TeamSection } from "@/components/docs/TeamSection";
import { ChangelogSection } from "@/components/docs/ChangelogSection";
import { TractionMetrics } from "@/components/docs/TractionMetrics";
import { Button } from "@/components/ui/button";
import { Search, Download, FileText } from "lucide-react";
import { generateDocsMarkdown } from "@/lib/docs-utils";

export function DocsPage() {
  const { accessible, visibility, sections, team, changelog, loading } = useDocs();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navItems = useMemo(
    () =>
      sections
        .filter((s) => s.slug !== "cover")
        .map((s) => ({
          slug: s.slug,
          title: s.title,
          category: s.category,
        })),
    [sections]
  );

  const coverSection = sections.find((s) => s.slug === "cover");

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-16 space-y-4">
            <div className="h-10 w-72 animate-pulse rounded-lg bg-muted" />
            <div className="h-5 w-96 animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="space-y-12">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-7 w-48 animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!accessible) return <DocsUnavailable />;

  const contentSections = sections.filter((s) => s.slug !== "cover");
  const pitchSections = contentSections.filter((s) => s.category === "pitch");
  const technicalSections = contentSections.filter(
    (s) => s.category === "technical"
  );
  const adminSections = contentSections.filter((s) => s.category === "admin");

  function handleExportMarkdown() {
    const md = generateDocsMarkdown(sections, team, changelog);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spacelinear-docs.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <>
      <DocsLayout
        sidebar={
          <SidebarNav
            items={navItems}
            coverTitle={coverSection?.title}
          />
        }
        header={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="gap-2"
            >
              <Search className="h-4 w-4" />
              Search
              <kbd className="ml-1 hidden rounded border bg-muted px-1.5 text-[10px] font-medium md:inline-block">
                ⌘K
              </kbd>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportMarkdown}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden md:inline">Markdown</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden md:inline">PDF</span>
            </Button>
          </div>
        }
      >
        {/* Cover / Hero */}
        {coverSection && (
          <CoverSection section={coverSection} />
        )}

        {/* Pitch Deck Sections */}
        {pitchSections.map((section) => (
          <DocSectionWrapper
            key={section.id}
            section={section}
            isTraction={section.slug === "traction"}
            team={team}
          />
        ))}

        {/* Team Section - special rendering */}
        {team.length > 0 && (
          <TeamSection teamMembers={team} />
        )}

        {/* Technical Sections */}
        {technicalSections.map((section) => (
          <DocSectionWrapper
            key={section.id}
            section={section}
          />
        ))}

        {/* Admin / Changelog */}
        {adminSections.map((section) => (
          <DocSectionWrapper
            key={section.id}
            section={section}
            isChangelog={section.slug === "changelog"}
            changelog={changelog}
          />
        ))}

        {/* Footer */}
        <footer className="border-t border-border pt-8 pb-16 text-center text-sm text-muted-foreground">
          <p>SpaceLinear — AI-Powered Spaced Repetition</p>
          <p className="mt-1">
            © {new Date().getFullYear()} SpaceLinear. All rights reserved.
          </p>
          {visibility && (
            <p className="mt-2 text-xs text-muted-foreground/60">
              Docs version published{" "}
              {visibility.start_at
                ? new Date(visibility.start_at).toLocaleDateString()
                : "on demand"}
              {visibility.end_at
                ? ` — ${new Date(visibility.end_at).toLocaleDateString()}`
                : ""}
            </p>
          )}
        </footer>
      </DocsLayout>

      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        sections={contentSections}
        team={team}
      />
    </>
  );
}

function CoverSection({ section }: { section: any }) {
  const content = section.content as Record<string, any>;
  return (
    <section
      id="cover"
      className="mb-20 flex min-h-[60vh] flex-col justify-center border-b border-border pb-16"
    >
      <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">
        {content?.label || "Pitch Deck"}
      </p>
      <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
        {content?.heading || section.title}
      </h1>
      {content?.tagline && (
        <p className="mb-6 max-w-2xl text-xl text-muted-foreground">
          {content.tagline}
        </p>
      )}
      {content?.description && (
        <p className="mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground/80">
          {content.description}
        </p>
      )}
      {content?.cta_button && (
        <div className="flex gap-4">
          <a
            href={content.cta_button.href || "#section-problem"}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            {content.cta_button.text || "Explore"}
          </a>
        </div>
      )}
    </section>
  );
}

function DocSectionWrapper({
  section,
  isTraction,
  team,
  isChangelog,
  changelog,
}: {
  section: any;
  isTraction?: boolean;
  team?: any[];
  isChangelog?: boolean;
  changelog?: any[];
}) {
  return (
    <section
      id={`section-${section.slug}`}
      className="mb-16 scroll-mt-20 border-b border-border/50 pb-16 last:border-0"
    >
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">
        {section.category === "pitch" ? "Pitch" : section.category === "technical" ? "Technical" : ""}
      </p>
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
        {section.title}
      </h2>
      {section.subtitle && (
        <p className="mb-8 text-muted-foreground">{section.subtitle}</p>
      )}

      <div className="prose prose-sm dark:prose-invert max-w-none">
        {isTraction ? (
          <TractionMetrics content={section.content} />
        ) : isChangelog ? (
          <ChangelogSection entries={changelog || []} />
        ) : (
          <SectionRenderer content={section.content} slug={section.slug} />
        )}
      </div>
    </section>
  );
}
