"use client";

import { useEffect, useState, useCallback } from "react";
import type { DocsSection, TeamMember, ChangelogEntry, Visibility } from "@/lib/docs-utils";
import {
  fetchAllSections,
  fetchAllTeamMembers,
  fetchChangelog,
  fetchVisibility,
  isAdmin,
} from "@/lib/docs-utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Json } from "@/integrations/supabase/types";

export function useDocsAdmin() {
  const { user } = useAuth();
  const [admin, setAdmin] = useState(false);
  const [sections, setSections] = useState<DocsSection[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [visibility, setVisibility] = useState<Visibility | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const adminCheck = await isAdmin(user.id);
      setAdmin(adminCheck);
      if (adminCheck) {
        const [sec, tm, ch, vis] = await Promise.all([
          fetchAllSections(),
          fetchAllTeamMembers(),
          fetchChangelog(),
          fetchVisibility(),
        ]);
        setSections(sec);
        setTeam(tm);
        setChangelog(ch);
        setVisibility(vis);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const reorderSections = useCallback(async (orderedIds: string[]) => {
    const updates = orderedIds.map((id, index) => ({
      id,
      sort_order: index,
    }));
    for (const u of updates) {
      await supabase.from("docs_sections").update({ sort_order: u.sort_order }).eq("id", u.id);
    }
    setSections((prev) =>
      prev
        .sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id))
        .map((s, i) => ({ ...s, sort_order: i }))
    );
  }, []);

  const updateSection = useCallback(async (id: string, data: Partial<DocsSection>) => {
    await supabase.from("docs_sections").update({ ...data, updated_at: new Date().toISOString() }).eq("id", id);
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  }, []);

  const deleteSection = useCallback(async (id: string) => {
    await supabase.from("docs_sections").delete().eq("id", id);
    setSections((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const createSection = useCallback(async (data: {
    slug: string;
    title: string;
    subtitle?: string;
    category: string;
    content: Json;
  }) => {
    const maxOrder = sections.reduce((max, s) => Math.max(max, s.sort_order), 0);
    const { data: newSection } = await supabase
      .from("docs_sections")
      .insert({ ...data, sort_order: maxOrder + 1, is_published: false })
      .select()
      .single();
    if (newSection) {
      setSections((prev) => [...prev, newSection as DocsSection]);
    }
  }, [sections]);

  const updateVisibility = useCallback(async (data: Partial<Visibility>) => {
    if (!visibility) return;
    await supabase
      .from("docs_visibility")
      .update({ ...data, updated_at: new Date().toISOString(), updated_by: user?.id })
      .eq("id", visibility.id);
    setVisibility((prev) => (prev ? { ...prev, ...data } : prev));
  }, [visibility, user]);

  const updateTeamMember = useCallback(async (id: string, data: Partial<TeamMember>) => {
    await supabase
      .from("docs_team_members")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id);
    setTeam((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)));
  }, []);

  const deleteTeamMember = useCallback(async (id: string) => {
    await supabase.from("docs_team_members").delete().eq("id", id);
    setTeam((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const createTeamMember = useCallback(async (data: {
    full_name: string;
    role: string;
    email?: string;
    avatar_url?: string;
    bio?: string;
  }) => {
    const maxOrder = team.reduce((max, m) => Math.max(max, m.sort_order), 0);
    const { data: newMember } = await supabase
      .from("docs_team_members")
      .insert({ ...data, sort_order: maxOrder + 1, is_active: true })
      .select()
      .single();
    if (newMember) {
      setTeam((prev) => [...prev, newMember as TeamMember]);
    }
  }, [team]);

  const createChangelog = useCallback(async (data: {
    version: string;
    date: string;
    changes: Json;
  }) => {
    const { data: newEntry } = await supabase
      .from("docs_changelog")
      .insert(data)
      .select()
      .single();
    if (newEntry) {
      setChangelog((prev) => [newEntry as ChangelogEntry, ...prev]);
    }
  }, []);

  const deleteChangelog = useCallback(async (id: string) => {
    await supabase.from("docs_changelog").delete().eq("id", id);
    setChangelog((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return {
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
  };
}
