"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import { PageShell } from "@/components/app/PageShell";
import { PageHeader } from "@/components/app/PageHeader";
import { MaterialsToolbar } from "@/components/materials/MaterialsToolbar";
import { MaterialCard } from "@/components/materials/MaterialCard";
import { MaterialListItem } from "@/components/materials/MaterialListItem";
import { CreateFolderModal } from "@/components/materials/CreateFolderModal";
import { AddLinkModal } from "@/components/materials/AddLinkModal";
import { AddTextModal } from "@/components/materials/AddTextModal";
import { RenameModal } from "@/components/materials/RenameModal";
import { MoveModal } from "@/components/materials/MoveModal";
import { DeleteConfirmDialog } from "@/components/materials/DeleteConfirmDialog";
import { EmptyState } from "@/components/materials/EmptyState";
import { UploadButton } from "@/components/materials/UploadButton";
import { toast } from "sonner";
import type { Material } from "@/lib/types";
import { AgentPanel } from "@/components/agent/AgentPanel";
import type {
  ViewMode,
  SortField,
} from "@/components/materials/MaterialsToolbar";

export function MaterialsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const {
    materials,
    currentFolderId,
    setCurrentFolderId,
    fetchMaterials,
    fetchMaterialBreadcrumbs,
    createFolder,
    uploadFile,
    addLink,
    addText,
    renameMaterial,
    deleteMaterial,
    toggleStar,
    moveMaterial,
    quizGenerationStatus,
  } = useStore();

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [crumbs, setCrumbs] = useState<Material[]>([]);

  // Modal state
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [showAddText, setShowAddText] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Material | null>(null);
  const [moveTarget, setMoveTarget] = useState<Material | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);

  // Load materials on mount and on folder change
  useEffect(() => {
    if (!userId) return;
    fetchMaterials(userId, currentFolderId);
  }, [userId, currentFolderId, fetchMaterials]);

  // Load breadcrumbs when folder changes
  useEffect(() => {
    if (!currentFolderId) {
      setCrumbs([]);
      return;
    }
    fetchMaterialBreadcrumbs(currentFolderId).then(setCrumbs);
  }, [currentFolderId, fetchMaterialBreadcrumbs]);

  // Navigate into folder
  const handleNavigate = useCallback(
    (folderId: string | null) => {
      setCurrentFolderId(folderId);
      setSearchQuery("");
    },
    [setCurrentFolderId],
  );

  // Filtered + sorted materials
  const displayedMaterials = useMemo(() => {
    let list = [...materials];

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q));
    }

    // Sort
    list.sort((a, b) => {
      // Folders first
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;

      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "updated_at":
          cmp =
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          break;
        case "type":
          cmp = a.type.localeCompare(b.type);
          break;
        case "file_size":
          cmp = (a.fileSize ?? 0) - (b.fileSize ?? 0);
          break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [materials, searchQuery, sortField, sortAsc]);

  const handleCreateFolder = useCallback(
    async (name: string) => {
      if (!userId) return;
      await createFolder(name, currentFolderId, userId);
      toast.success(`Folder "${name}" created`);
    },
    [userId, currentFolderId, createFolder],
  );

  const handleUploadFiles = useCallback(
    async (files: FileList) => {
      if (!userId) return;
      for (const file of Array.from(files)) {
        await uploadFile(file, currentFolderId, userId);
        toast.success(`Uploaded "${file.name}" — generating quizzes...`);
      }
    },
    [userId, currentFolderId, uploadFile],
  );

  const handleAddLink = useCallback(
    async (name: string, url: string) => {
      if (!userId) return;
      await addLink(name, url, currentFolderId, userId);
      toast.success("Link added — generating quizzes...");
    },
    [userId, currentFolderId, addLink],
  );

  const handleAddText = useCallback(
    async (name: string, content: string) => {
      if (!userId) return;
      await addText(name, content, currentFolderId, userId);
      toast.success("Text note added — generating quizzes...");
    },
    [userId, currentFolderId, addText],
  );

  const pendingQuizCount = Object.values(quizGenerationStatus).filter(
    (status) => status === "pending",
  ).length;

  const handleRename = useCallback(
    async (newName: string) => {
      if (!renameTarget) return;
      await renameMaterial(renameTarget.id, newName);
      toast.success("Renamed");
    },
    [renameTarget, renameMaterial],
  );

  const handleMove = useCallback(
    async (newParentId: string | null) => {
      if (!moveTarget) return;
      await moveMaterial(moveTarget.id, newParentId);
      toast.success("Moved");
    },
    [moveTarget, moveMaterial],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteMaterial(deleteTarget.id);
    toast.success("Moved to trash");
  }, [deleteTarget, deleteMaterial]);

  return (
    <PageShell>
      <PageHeader
        title="Materials"
        description="Organize your files, links, and notes in folders."
      />

      <div className="space-y-4">
        {pendingQuizCount > 0 && (
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Generating quizzes for {pendingQuizCount} material
            {pendingQuizCount === 1 ? "" : "s"}...
          </div>
        )}

        {/* Toolbar */}
        <MaterialsToolbar
          crumbs={crumbs}
          viewMode={viewMode}
          sortField={sortField}
          sortAsc={sortAsc}
          searchQuery={searchQuery}
          onNavigate={handleNavigate}
          onViewModeChange={setViewMode}
          onSortChange={setSortField}
          onSortDirToggle={() => setSortAsc((a) => !a)}
          onSearchChange={setSearchQuery}
          onCreateFolder={() => setShowCreateFolder(true)}
          onUploadFile={() => setShowUpload(true)}
          onAddLink={() => setShowAddLink(true)}
          onAddText={() => setShowAddText(true)}
        />

        {/* Upload drop zone */}
        {showUpload && (
          <div className="relative">
            <UploadButton onUpload={handleUploadFiles} />
            <button
              onClick={() => setShowUpload(false)}
              className="mt-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel upload
            </button>
          </div>
        )}

        {/* Empty state */}
        {displayedMaterials.length === 0 && !searchQuery && (
          <EmptyState
            isRoot={currentFolderId === null}
            onCreateFolder={() => setShowCreateFolder(true)}
            onUploadFile={() => setShowUpload(true)}
          />
        )}

        {/* No search results */}
        {displayedMaterials.length === 0 && searchQuery && (
          <div className="flex min-h-[20vh] items-center justify-center text-sm text-muted-foreground">
            No materials matching "{searchQuery}"
          </div>
        )}

        {/* Grid view */}
        {viewMode === "grid" && displayedMaterials.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {displayedMaterials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                onNavigate={handleNavigate}
                onRename={() => setRenameTarget(material)}
                onDelete={() => setDeleteTarget(material)}
                onToggleStar={() => toggleStar(material.id)}
                onMove={() => setMoveTarget(material)}
              />
            ))}
          </div>
        )}

        {/* List view */}
        {viewMode === "list" && displayedMaterials.length > 0 && (
          <div className="space-y-1">
            {displayedMaterials.map((material) => (
              <MaterialListItem
                key={material.id}
                material={material}
                onNavigate={handleNavigate}
                onRename={() => setRenameTarget(material)}
                onDelete={() => setDeleteTarget(material)}
                onToggleStar={() => toggleStar(material.id)}
                onMove={() => setMoveTarget(material)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateFolderModal
        open={showCreateFolder}
        onOpenChange={setShowCreateFolder}
        onSubmit={handleCreateFolder}
      />

      <AddLinkModal
        open={showAddLink}
        onOpenChange={setShowAddLink}
        onSubmit={handleAddLink}
      />

      <AddTextModal
        open={showAddText}
        onOpenChange={setShowAddText}
        onSubmit={handleAddText}
      />

      {renameTarget && (
        <RenameModal
          open={!!renameTarget}
          onOpenChange={(open) => !open && setRenameTarget(null)}
          currentName={renameTarget.name}
          onSubmit={handleRename}
        />
      )}

      {moveTarget && (
        <MoveModal
          open={!!moveTarget}
          onOpenChange={(open) => !open && setMoveTarget(null)}
          currentParentId={moveTarget.parentId}
          itemName={moveTarget.name}
          onSubmit={handleMove}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          itemName={deleteTarget.name}
          isFolder={deleteTarget.type === "folder"}
          onConfirm={handleDelete}
        />
      )}
      <AgentPanel context="materials" />
    </PageShell>
  );
}
