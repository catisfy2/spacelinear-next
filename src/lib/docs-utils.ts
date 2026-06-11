import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type DocsSection = Database["public"]["Tables"]["docs_sections"]["Row"];
type TeamMember = Database["public"]["Tables"]["docs_team_members"]["Row"];
type ChangelogEntry = Database["public"]["Tables"]["docs_changelog"]["Row"];
type Visibility = Database["public"]["Tables"]["docs_visibility"]["Row"];

export type { DocsSection, TeamMember, ChangelogEntry, Visibility };

export async function checkDocsVisibility(): Promise<{
  accessible: boolean;
  visibility: Visibility | null;
}> {
  const { data } = await supabase
    .from("docs_visibility")
    .select("*")
    .limit(1)
    .single();

  if (!data) return { accessible: false, visibility: null };
  if (!data.is_public) return { accessible: false, visibility: data };

  const now = new Date();
  if (data.start_at && now < new Date(data.start_at))
    return { accessible: false, visibility: data };
  if (data.end_at && now > new Date(data.end_at))
    return { accessible: false, visibility: data };

  return { accessible: true, visibility: data };
}

export async function fetchPublicSections(): Promise<DocsSection[]> {
  const { data, error } = await supabase
    .from("docs_sections")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("fetchPublicSections error:", error);
    return [];
  }

  if (!data || data.length === 0) {
    console.warn("fetchPublicSections returned 0 rows");
  }

  return data ?? [];
}

export async function fetchAllSections(): Promise<DocsSection[]> {
  const { data } = await supabase
    .from("docs_sections")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("docs_team_members")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("fetchTeamMembers error:", error);
    return [];
  }
  return data ?? [];
}

export async function fetchAllTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("docs_team_members")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("fetchAllTeamMembers error:", error);
    return [];
  }
  return data ?? [];
}

export async function fetchChangelog(): Promise<ChangelogEntry[]> {
  const { data, error } = await supabase
    .from("docs_changelog")
    .select("*")
    .order("date", { ascending: false });
  if (error) {
    console.error("fetchChangelog error:", error);
    return [];
  }
  return data ?? [];
}

export async function fetchVisibility(): Promise<Visibility | null> {
  const { data } = await supabase
    .from("docs_visibility")
    .select("*")
    .limit(1)
    .single();
  return data;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role === "admin";
}

export function generateDocsMarkdown(
  sections: DocsSection[],
  team: TeamMember[],
  changelog: ChangelogEntry[]
): string {
  const lines: string[] = [];

  for (const section of sections) {
    if (section.slug === "cover") continue;
    lines.push(`# ${section.title}`);
    if (section.subtitle) lines.push(`> ${section.subtitle}`);
    lines.push("");
    const content = section.content as Record<string, unknown>;
    if (content?.body) {
      lines.push(content.body as string);
      lines.push("");
    }
    if (content?.description) {
      lines.push(content.description as string);
      lines.push("");
    }
    if (content?.solution_statement) {
      lines.push(content.solution_statement as string);
      lines.push("");
    }
    if (content?.vision_statement) {
      lines.push(content.vision_statement as string);
      lines.push("");
    }
  }

  if (team.length > 0) {
    lines.push("## Team");
    lines.push("");
    for (const member of team) {
      lines.push(`- **${member.full_name}** — ${member.role} (${member.email})`);
    }
    lines.push("");
  }

  if (changelog.length > 0) {
    lines.push("## Changelog");
    lines.push("");
    for (const entry of changelog) {
      lines.push(`### ${entry.version} (${entry.date})`);
      const changes = entry.changes as string[];
      if (Array.isArray(changes)) {
        for (const change of changes) {
          lines.push(`- ${change}`);
        }
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}
