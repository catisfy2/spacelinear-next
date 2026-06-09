import { create } from "zustand";
import type {
  Topic,
  Subject,
  ReviewHistoryEntry,
  Difficulty,
  Resource,
  Material,
  MaterialType,
  Note,
} from "@/lib/types";
import { processReview, INITIAL_EASE } from "@/lib/algorithm";
import { supabase } from "@/integrations/supabase/client";

interface AppState {
  subjects: Subject[];
  topics: Topic[];
  reviewHistory: ReviewHistoryEntry[];
  resources: Resource[];
  sidebarCollapsed: boolean;
  selectedSidebarTopicId: string | null;
  loading: boolean;

  // Actions
  toggleSidebar: () => void;
  setSelectedSidebarTopicId: (id: string | null) => void;
  fetchAll: (userId: string) => Promise<void>;
  clear: () => void;
  addSubject: (
    subject: Omit<Subject, "id" | "createdAt">,
    userId: string,
  ) => Promise<Subject>;
  addTopic: (
    topic: Omit<
      Topic,
      | "id"
      | "createdAt"
      | "state"
      | "currentDifficulty"
      | "nextReviewDate"
      | "currentIntervalDays"
      | "easeFactor"
      | "totalReviews"
      | "correctReviews"
      | "streak"
      | "firstReviewedAt"
      | "lastReviewedAt"
    >,
    userId: string,
  ) => Promise<Topic>;
  submitReview: (
    topicId: string,
    difficulty: Difficulty,
    userId: string,
    commitMessage?: string,
  ) => Promise<void>;
  getDueTopics: () => Topic[];
  getSubjectDueCount: (subjectId: string) => number;
  deleteTopic: (topicId: string) => Promise<void>;
  deleteSubject: (subjectId: string) => Promise<void>;
  updateTopic: (topicId: string, patch: Partial<Topic>) => Promise<void>;
  updateSubject: (subjectId: string, patch: Partial<Subject>) => Promise<void>;
  fetchResources: (entityId: string, userId: string) => Promise<void>;
  addResource: (
    resource: Omit<Resource, "id" | "createdAt">,
    userId: string,
  ) => Promise<Resource>;
  deleteResource: (resourceId: string) => Promise<void>;
  refreshTopicFromDb: (topicId: string) => Promise<void>;
  scheduleTopicForToday: (topicId: string) => Promise<void>;
  moveToBacklog: (topicId: string) => Promise<void>;
  archiveTopic: (topicId: string) => Promise<void>;
  unarchiveTopic: (topicId: string) => Promise<void>;

  // Notes
  notes: Note[];

  fetchNotes: (userId: string) => Promise<void>;
  createNote: (userId: string) => Promise<Note>;
  updateNote: (id: string, patch: Partial<Note>) => Promise<void>;
  toggleNoteStar: (id: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  // Materials
  materials: Material[];
  currentFolderId: string | null;
  fetchMaterials: (userId: string, parentId?: string | null) => Promise<void>;
  fetchMaterialBreadcrumbs: (materialId: string | null) => Promise<Material[]>;
  createFolder: (
    name: string,
    parentId: string | null,
    userId: string,
  ) => Promise<Material>;
  uploadFile: (
    file: File,
    parentId: string | null,
    userId: string,
  ) => Promise<Material>;
  addLink: (
    name: string,
    url: string,
    parentId: string | null,
    userId: string,
  ) => Promise<Material>;
  addText: (
    name: string,
    content: string,
    parentId: string | null,
    userId: string,
  ) => Promise<Material>;
  renameMaterial: (id: string, name: string) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  permanentlyDeleteMaterial: (id: string) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  moveMaterial: (id: string, newParentId: string | null) => Promise<void>;
  setCurrentFolderId: (folderId: string | null) => void;

}

function mapResourceRow(row: any): Resource {
  return {
    id: row.id,
    entityId: row.entity_id,
    entityType: row.entity_type as Resource["entityType"],
    type: row.type as Resource["type"],
    title: row.title,
    url: row.url ?? undefined,
    content: row.content ?? undefined,
    createdAt: row.created_at,
  };
}

// DB row -> app type mappers
function mapMaterialRow(row: any): Material {
  return {
    id: row.id,
    userId: row.user_id,
    parentId: row.parent_id ?? null,
    name: row.name,
    type: row.type as Material["type"],
    mimeType: row.mime_type ?? undefined,
    fileSize: row.file_size ?? undefined,
    storagePath: row.storage_path ?? undefined,
    url: row.url ?? undefined,
    content: row.content ?? undefined,
    metadata: row.metadata ?? {},
    isStarred: row.is_starred ?? false,
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}


function mapSubjectRow(row: any): Subject {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    color: row.color ?? "#6366f1",
    icon: row.icon ?? "📘",
    createdAt: row.created_at,
  };
}

function mapTopicRow(row: any): Topic {
  return {
    id: row.id,
    subjectId: row.subject_id,
    planId: row.plan_id ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    notes: row.notes ?? undefined,
    tags: row.tags ?? [],
    state: row.state as Topic["state"],
    currentDifficulty: row.current_difficulty ?? undefined,
    nextReviewDate: row.next_review_date,
    currentIntervalDays: row.current_interval_days,
    easeFactor: row.ease_factor,
    totalReviews: row.total_reviews,
    correctReviews: row.correct_reviews,
    streak: row.streak,
    firstReviewedAt: row.first_reviewed_at ?? undefined,
    lastReviewedAt: row.last_reviewed_at ?? undefined,
    createdAt: row.created_at,
  };
}

function mapNoteRow(row: any): Note {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content ?? "",
    tags: row.tags ?? [],
    starred: row.starred ?? false,
    deletedAt: row.deleted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapHistoryRow(row: any): ReviewHistoryEntry {
  return {
    id: row.id,
    topicId: row.topic_id,
    reviewedAt: row.reviewed_at,
    difficultyBefore: row.difficulty_before ?? undefined,
    difficultySelected: row.difficulty_selected as Difficulty,
    intervalBeforeDays: row.interval_before_days,
    intervalAfterDays: row.interval_after_days,
    easeFactor: row.ease_factor,
    reviewNumber: row.review_number,
    commitMessage: row.commit_message ?? undefined,
  };
}

export const useStore = create<AppState>()((set, get) => ({
  subjects: [],
  topics: [],
  reviewHistory: [],
  resources: [],
  sidebarCollapsed: false,
  selectedSidebarTopicId: null,
  loading: true,

  // Notes state
  notes: [],

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSelectedSidebarTopicId: (id) => set({ selectedSidebarTopicId: id }),

  fetchAll: async (userId: string) => {
    set({ loading: true });
    const [subjectsRes, topicsRes, historyRes] = await Promise.all([
      supabase.from("subjects").select("*").eq("user_id", userId),
      supabase.from("topics").select("*").eq("user_id", userId),
      supabase.from("review_history").select("*").eq("user_id", userId),
    ]);
    set({
      subjects: (subjectsRes.data ?? []).map(mapSubjectRow),
      topics: (topicsRes.data ?? []).map(mapTopicRow),
      reviewHistory: (historyRes.data ?? []).map(mapHistoryRow),
      loading: false,
    });
  },

  clear: () =>
    set({
      subjects: [],
      topics: [],
      reviewHistory: [],
      resources: [],
      loading: false,
    }),

  addSubject: async (data, userId) => {
    const { data: rows, error } = await supabase
      .from("subjects")
      .insert({
        name: data.name,
        description: data.description ?? null,
        color: data.color,
        icon: data.icon,
        user_id: userId,
      })
      .select()
      .single();
    if (error || !rows) throw error;
    const subject = mapSubjectRow(rows);
    set((s) => ({ subjects: [...s.subjects, subject] }));
    return subject;
  },

  addTopic: async (data, userId) => {
    const farFuture = new Date().toISOString();
    const { data: row, error } = await supabase
      .from("topics")
      .insert({
        title: data.title,
        description: data.description ?? null,
        notes: data.notes ?? null,
        subject_id: data.subjectId || null,
        tags: data.tags,
        state: "backlog",
        next_review_date: farFuture,
        current_interval_days: 0,
        ease_factor: INITIAL_EASE,
        total_reviews: 0,
        correct_reviews: 0,
        streak: 0,
        user_id: userId,
      })
      .select()
      .single();
    if (error || !row) throw error;
    const topic = mapTopicRow(row);
    set((s) => ({ topics: [...s.topics, topic] }));
    return topic;
  },

  submitReview: async (topicId, difficulty, userId, commitMessage) => {
    const topic = get().topics.find((t) => t.id === topicId);
    if (!topic) return;
    const { updatedTopic, historyEntry } = processReview(
      topic,
      difficulty,
      commitMessage,
    );

    // Update topic in DB
    await supabase
      .from("topics")
      .update({
        state: updatedTopic.state,
        current_difficulty: updatedTopic.currentDifficulty ?? null,
        next_review_date: updatedTopic.nextReviewDate,
        current_interval_days: updatedTopic.currentIntervalDays,
        ease_factor: updatedTopic.easeFactor,
        total_reviews: updatedTopic.totalReviews,
        correct_reviews: updatedTopic.correctReviews,
        streak: updatedTopic.streak,
        first_reviewed_at: updatedTopic.firstReviewedAt ?? null,
        last_reviewed_at: updatedTopic.lastReviewedAt ?? null,
      })
      .eq("id", topicId);

    // Insert history
    await supabase.from("review_history").insert({
      topic_id: historyEntry.topicId,
      reviewed_at: historyEntry.reviewedAt,
      difficulty_before: historyEntry.difficultyBefore ?? null,
      difficulty_selected: historyEntry.difficultySelected,
      interval_before_days: historyEntry.intervalBeforeDays,
      interval_after_days: historyEntry.intervalAfterDays,
      ease_factor: historyEntry.easeFactor,
      review_number: historyEntry.reviewNumber,
      commit_message: historyEntry.commitMessage ?? null,
      user_id: userId,
    });

    set((s) => ({
      topics: s.topics.map((t) => (t.id === topicId ? updatedTopic : t)),
      reviewHistory: [...s.reviewHistory, historyEntry],
    }));
  },

  getDueTopics: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return get()
      .topics.filter((t) => {
        const d = new Date(t.nextReviewDate);
        d.setHours(0, 0, 0, 0);
        return d < tomorrow;
      })
      .sort((a, b) => {
        const stateOrder: Record<string, number> = {
          relearning: 0,
          learning: 1,
          new: 2,
          reviewing: 3,
        };
        return (stateOrder[a.state] ?? 3) - (stateOrder[b.state] ?? 3);
      });
  },

  getSubjectDueCount: (subjectId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return get().topics.filter((t) => {
      if (t.subjectId !== subjectId) return false;
      const d = new Date(t.nextReviewDate);
      d.setHours(0, 0, 0, 0);
      return d < tomorrow;
    }).length;
  },

  deleteTopic: async (topicId) => {
    await supabase.from("review_history").delete().eq("topic_id", topicId);
    await supabase.from("topics").delete().eq("id", topicId);
    set((s) => ({
      topics: s.topics.filter((t) => t.id !== topicId),
      reviewHistory: s.reviewHistory.filter((h) => h.topicId !== topicId),
    }));
  },

  deleteSubject: async (subjectId) => {
    await supabase.from("topics").delete().eq("subject_id", subjectId);
    await supabase.from("subjects").delete().eq("id", subjectId);
    set((s) => ({
      subjects: s.subjects.filter((s2) => s2.id !== subjectId),
      topics: s.topics.filter((t) => t.subjectId !== subjectId),
    }));
  },

  updateTopic: async (topicId, patch) => {
    const dbPatch: Record<string, any> = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.description !== undefined)
      dbPatch.description = patch.description;
    if (patch.notes !== undefined) dbPatch.notes = patch.notes;
    if (patch.tags !== undefined) dbPatch.tags = patch.tags;
    if (patch.subjectId !== undefined) dbPatch.subject_id = patch.subjectId;
    if (Object.keys(dbPatch).length > 0) {
      await supabase.from("topics").update(dbPatch).eq("id", topicId);
    }
    set((s) => ({
      topics: s.topics.map((t) => (t.id === topicId ? { ...t, ...patch } : t)),
    }));
  },

  updateSubject: async (subjectId, patch) => {
    const dbPatch: Record<string, any> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.description !== undefined)
      dbPatch.description = patch.description;
    if (patch.icon !== undefined) dbPatch.icon = patch.icon;
    if (patch.color !== undefined) dbPatch.color = patch.color;
    if (Object.keys(dbPatch).length > 0) {
      await supabase.from("subjects").update(dbPatch).eq("id", subjectId);
    }
    set((s) => ({
      subjects: s.subjects.map((sub) =>
        sub.id === subjectId ? { ...sub, ...patch } : sub,
      ),
    }));
  },

  fetchResources: async (entityId, userId) => {
    const { data } = await supabase
      .from("resources")
      .select("*")
      .eq("entity_id", entityId)
      .eq("user_id", userId);
    const fetched = (data ?? []).map(mapResourceRow);
    set((s) => ({
      resources: [
        ...s.resources.filter((r) => r.entityId !== entityId),
        ...fetched,
      ],
    }));
  },

  addResource: async (resource, userId) => {
    const { data: row, error } = await supabase
      .from("resources")
      .insert({
        entity_id: resource.entityId,
        entity_type: resource.entityType,
        type: resource.type,
        title: resource.title,
        url: resource.url ?? null,
        content: resource.content ?? null,
        user_id: userId,
      })
      .select()
      .single();
    if (error || !row) throw error;
    const mapped = mapResourceRow(row);
    set((s) => ({ resources: [...s.resources, mapped] }));
    return mapped;
  },

  deleteResource: async (resourceId) => {
    await supabase.from("resources").delete().eq("id", resourceId);
    set((s) => ({ resources: s.resources.filter((r) => r.id !== resourceId) }));
  },

  refreshTopicFromDb: async (topicId: string) => {
    const { data } = await supabase
      .from("topics")
      .select("*")
      .eq("id", topicId)
      .single();
    if (data) {
      const topic = mapTopicRow(data);
      set((s) => ({
        topics: s.topics.map((t) => (t.id === topicId ? topic : t)),
      }));
    }
  },

  scheduleTopicForToday: async (topicId: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const iso = now.toISOString();

    await supabase
      .from("topics")
      .update({ state: "new", next_review_date: iso })
      .eq("id", topicId);

    set((s) => ({
      topics: s.topics.map((t) =>
        t.id === topicId
          ? { ...t, state: "new" as const, nextReviewDate: iso }
          : t,
      ),
    }));
  },

  moveToBacklog: async (topicId: string) => {
    const farFuture = new Date(
      Date.now() + 365 * 24 * 60 * 60 * 1000,
    ).toISOString();

    await supabase
      .from("topics")
      .update({ state: "backlog", next_review_date: farFuture })
      .eq("id", topicId);

    set((s) => ({
      topics: s.topics.map((t) =>
        t.id === topicId
          ? { ...t, state: "backlog" as const, nextReviewDate: farFuture }
          : t,
      ),
    }));
  },

  archiveTopic: async (topicId: string) => {
    await supabase
      .from("topics")
      .update({ state: "archived" })
      .eq("id", topicId);

    set((s) => ({
      topics: s.topics.map((t) =>
        t.id === topicId ? { ...t, state: "archived" as const } : t,
      ),
    }));
  },

  unarchiveTopic: async (topicId: string) => {
    const farFuture = new Date(
      Date.now() + 365 * 24 * 60 * 60 * 1000,
    ).toISOString();

    await supabase
      .from("topics")
      .update({ state: "backlog", next_review_date: farFuture })
      .eq("id", topicId);

    set((s) => ({
      topics: s.topics.map((t) =>
        t.id === topicId
          ? { ...t, state: "backlog" as const, nextReviewDate: farFuture }
          : t,
      ),
    }));
  },

  // ── Notes ────────────────────────────────────────────────────────────

  fetchNotes: async (userId) => {
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });
    set({ notes: (data ?? []).map(mapNoteRow) });
  },

  createNote: async (userId) => {
    const { data, error } = await supabase
      .from("notes")
      .insert({ user_id: userId })
      .select()
      .single();
    if (error || !data) throw error;
    const note = mapNoteRow(data);
    set((s) => ({ notes: [note, ...s.notes] }));
    return note;
  },

  updateNote: async (id, patch) => {
    const dbPatch: Record<string, any> = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.content !== undefined) dbPatch.content = patch.content;
    if (patch.tags !== undefined) dbPatch.tags = patch.tags;
    if (patch.starred !== undefined) dbPatch.starred = patch.starred;
    if (patch.deletedAt !== undefined) dbPatch.deleted_at = patch.deletedAt;
    dbPatch.updated_at = new Date().toISOString();

    await supabase.from("notes").update(dbPatch).eq("id", id);

    set((s) => ({
      notes: s.notes.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: dbPatch.updated_at } : n,
      ),
    }));
  },

  toggleNoteStar: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    const newStarred = !note.starred;
    await supabase
      .from("notes")
      .update({ starred: newStarred, updated_at: new Date().toISOString() })
      .eq("id", id);
    set((s) => ({
      notes: s.notes.map((n) =>
        n.id === id ? { ...n, starred: newStarred } : n,
      ),
    }));
  },

  deleteNote: async (id) => {
    await supabase
      .from("notes")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    set((s) => ({
      notes: s.notes.filter((n) => n.id !== id),
    }));
  },

  // ── Materials ────────────────────────────────────────────────────────

  materials: [],
  currentFolderId: null,

  setCurrentFolderId: (folderId) => set({ currentFolderId: folderId }),

  fetchMaterials: async (userId, parentId = null) => {
    let query = supabase
      .from("materials")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (parentId === null) {
      query = query.is("parent_id", null);
    } else {
      query = query.eq("parent_id", parentId);
    }

    const { data } = await query
      .order("type", { ascending: false })
      .order("name", { ascending: true });
    set({ materials: (data ?? []).map(mapMaterialRow) });
  },

  fetchMaterialBreadcrumbs: async (materialId) => {
    const crumbs: Material[] = [];
    let currentId = materialId;
    while (currentId) {
      const { data } = await supabase
        .from("materials")
        .select("*")
        .eq("id", currentId)
        .single();
      if (!data) break;
      crumbs.unshift(mapMaterialRow(data));
      currentId = data.parent_id;
    }
    return crumbs;
  },

  createFolder: async (name, parentId, userId) => {
    const { data, error } = await supabase
      .from("materials")
      .insert({
        name,
        type: "folder",
        parent_id: parentId,
        user_id: userId,
      })
      .select()
      .single();
    if (error || !data) throw error;
    const material = mapMaterialRow(data);
    set((s) => ({ materials: [...s.materials, material] }));
    return material;
  },

  uploadFile: async (file, parentId, userId) => {
    // Upload to Supabase Storage
    const filePath = `${userId}/${parentId || "root"}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("materials")
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("materials")
      .getPublicUrl(filePath);

    // Insert DB row
    const { data, error } = await supabase
      .from("materials")
      .insert({
        name: file.name,
        type: "file",
        mime_type: file.type,
        file_size: file.size,
        storage_path: filePath,
        url: urlData.publicUrl,
        parent_id: parentId,
        user_id: userId,
      })
      .select()
      .single();
    if (error || !data) {
      // Cleanup storage on DB failure
      await supabase.storage.from("materials").remove([filePath]);
      throw error;
    }
    const material = mapMaterialRow(data);
    set((s) => ({ materials: [...s.materials, material] }));
    return material;
  },

  addLink: async (name, url, parentId, userId) => {
    const { data, error } = await supabase
      .from("materials")
      .insert({
        name,
        type: "link",
        url,
        parent_id: parentId,
        user_id: userId,
      })
      .select()
      .single();
    if (error || !data) throw error;
    const material = mapMaterialRow(data);
    set((s) => ({ materials: [...s.materials, material] }));
    return material;
  },

  addText: async (name, content, parentId, userId) => {
    const { data, error } = await supabase
      .from("materials")
      .insert({
        name,
        type: "text",
        content,
        parent_id: parentId,
        user_id: userId,
      })
      .select()
      .single();
    if (error || !data) throw error;
    const material = mapMaterialRow(data);
    set((s) => ({ materials: [...s.materials, material] }));
    return material;
  },

  renameMaterial: async (id, name) => {
    const oldMaterial = get().materials.find((m) => m.id === id);

    const { error: matError } = await supabase.from("materials").update({ name }).eq("id", id);
    if (matError) throw matError;
    set((s) => ({
      materials: s.materials.map((m) => (m.id === id ? { ...m, name } : m)),
    }));

    // Sync question set title if linked via material_id and still using the old default title
    const oldTitle = oldMaterial?.name ? `Quiz: ${oldMaterial.name}` : null;
    let query = (supabase as any)
      .from("question_sets")
      .update({ title: `Quiz: ${name}` })
      .eq("material_id", id);
    if (oldTitle) {
      query = query.eq("title", oldTitle);
    }
    const { error: setError } = await query;
    if (setError) {
      console.error("Failed to update question set title:", setError);
    }
  },

  deleteMaterial: async (id) => {
    await supabase
      .from("materials")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    set((s) => ({
      materials: s.materials.filter((m) => m.id !== id),
    }));
  },

  permanentlyDeleteMaterial: async (id) => {
    // Get the material first to check for storage file
    const { data: material } = await supabase
      .from("materials")
      .select("*")
      .eq("id", id)
      .single();

    if (material?.storage_path) {
      await supabase.storage.from("materials").remove([material.storage_path]);
    }

    // Recursively delete children first
    const { data: children } = await supabase
      .from("materials")
      .select("id")
      .eq("parent_id", id);

    if (children) {
      for (const child of children) {
        await get().permanentlyDeleteMaterial(child.id);
      }
    }

    await supabase.from("materials").delete().eq("id", id);
    set((s) => ({
      materials: s.materials.filter((m) => m.id !== id),
    }));
  },

  toggleStar: async (id) => {
    const material = get().materials.find((m) => m.id === id);
    if (!material) return;
    const newStarred = !material.isStarred;
    await supabase
      .from("materials")
      .update({ is_starred: newStarred })
      .eq("id", id);
    set((s) => ({
      materials: s.materials.map((m) =>
        m.id === id ? { ...m, isStarred: newStarred } : m,
      ),
    }));
  },

  moveMaterial: async (id, newParentId) => {
    await supabase
      .from("materials")
      .update({ parent_id: newParentId })
      .eq("id", id);
    set((s) => ({
      materials: s.materials.map((m) =>
        m.id === id ? { ...m, parentId: newParentId } : m,
      ),
    }));
  },

}));

// Clean up old localStorage data
try {
  localStorage.removeItem("spacelinear-store");
} catch {}
