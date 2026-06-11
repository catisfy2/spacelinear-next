"use client";

import { useEffect, useState } from "react";
import type { DocsSection, TeamMember, ChangelogEntry, Visibility } from "@/lib/docs-utils";
import {
  checkDocsVisibility,
  fetchPublicSections,
  fetchTeamMembers,
  fetchChangelog,
} from "@/lib/docs-utils";

export function useDocs() {
  const [accessible, setAccessible] = useState<boolean | null>(null);
  const [visibility, setVisibility] = useState<Visibility | null>(null);
  const [sections, setSections] = useState<DocsSection[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { accessible: acc, visibility: vis } = await checkDocsVisibility();
        setAccessible(acc);
        setVisibility(vis);

        if (acc) {
          const [sec, tm, ch] = await Promise.all([
            fetchPublicSections(),
            fetchTeamMembers(),
            fetchChangelog(),
          ]);
          setSections(sec);
          setTeam(tm);
          setChangelog(ch);
        }
      } catch (err) {
        console.error("useDocs load failed:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { accessible, visibility, sections, team, changelog, loading };
}
