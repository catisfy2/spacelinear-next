"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  GripVertical,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocsSection } from "@/lib/docs-utils";
import type { Json } from "@/integrations/supabase/types";

interface SectionsManagerProps {
  sections: DocsSection[];
  onReorder: (orderedIds: string[]) => Promise<void>;
  onUpdate: (id: string, data: Partial<DocsSection>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCreate: (data: {
    slug: string;
    title: string;
    subtitle?: string;
    category: string;
    content: Json;
  }) => Promise<void>;
}

function SortableSection({
  section,
  onTogglePublish,
  onEdit,
  onDelete,
}: {
  section: DocsSection;
  onTogglePublish: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {section.title}
          </span>
          <Badge variant="outline" className="text-[10px]">
            {section.category}
          </Badge>
          {section.is_published ? (
            <Badge variant="default" className="text-[10px]">
              Published
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              Draft
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          /{section.slug} — Order: {section.sort_order}
        </div>
      </div>

      <button
        onClick={onTogglePublish}
        className="text-muted-foreground hover:text-foreground"
        title={section.is_published ? "Unpublish" : "Publish"}
      >
        {section.is_published ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>

      <button
        onClick={onEdit}
        className="text-muted-foreground hover:text-foreground"
        title="Edit"
      >
        <Edit3 className="h-4 w-4" />
      </button>

      <button
        onClick={onDelete}
        className="text-destructive hover:text-destructive/80"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function SectionsManager({
  sections,
  onReorder,
  onUpdate,
  onDelete,
  onCreate,
}: SectionsManagerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<DocsSection | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");

  // New section dialog
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newCategory, setNewCategory] = useState("pitch");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...sections];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorder(reordered.map((s) => s.id));
  }

  async function handleTogglePublish(section: DocsSection) {
    await onUpdate(section.id, { is_published: !section.is_published });
  }

  function openEditDialog(section: DocsSection) {
    setEditingSection(section);
    setEditTitle(section.title);
    setEditContent(JSON.stringify(section.content, null, 2));
  }

  async function saveEdit() {
    if (!editingSection) return;
    try {
      const content = JSON.parse(editContent);
      await onUpdate(editingSection.id, { title: editTitle, content: content as Json });
    } catch {
      alert("Invalid JSON content");
    }
    setEditingSection(null);
  }

  async function handleCreate() {
    if (!newSlug || !newTitle) return;
    await onCreate({
      slug: newSlug,
      title: newTitle,
      subtitle: newSubtitle || undefined,
      category: newCategory,
      content: { label: newTitle },
    });
    setNewSlug("");
    setNewTitle("");
    setNewSubtitle("");
    setNewDialogOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Drag to reorder. Click to edit content.
        </p>
        <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              New Section
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Section</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Slug</label>
                <Input
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="my-section"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="My Section"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subtitle</label>
                <Input
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="Optional subtitle"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="pitch">Pitch Deck</option>
                  <option value="technical">Technical</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Button onClick={handleCreate}>Create Section</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event: DragStartEvent) => setActiveId(event.active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                onTogglePublish={() => handleTogglePublish(section)}
                onEdit={() => openEditDialog(section)}
                onDelete={() => onDelete(section.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingSection}
        onOpenChange={(open) => !open && setEditingSection(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Section: {editingSection?.title}</DialogTitle>
          </DialogHeader>
          {editingSection && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Content (JSON)
                </label>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={15}
                  className="font-mono text-xs"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingSection(null)}>
                  Cancel
                </Button>
                <Button onClick={saveEdit}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
