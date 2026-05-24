"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/hooks/useAuth";
import type { Resource } from "@/lib/types";
import {
  clampZoom,
  createNoteNode,
  createResourceNode,
  parseTopicNotes,
  serializeCanvasState,
  type CanvasNode,
  type CanvasState,
  type NoteNode,
  type ResourceNode,
} from "@/lib/topicCanvas";
import {
  getResourceNodeSize,
  parseResourceFileMeta,
} from "@/lib/resourceFiles";
import { uploadTopicResourceFile } from "@/lib/uploadTopicResource";
import { formatRelativeTime } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Check,
  ExternalLink,
  FileText,
  GripVertical,
  Link2,
  Loader2,
  Minus,
  Plus,
  Presentation,
  StickyNote,
  Trash2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

const ACCEPTED_UPLOAD_INPUT =
  ".png,.pdf,.pptx,image/png,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation";

type SaveStatus = "idle" | "saving" | "saved";

const TYPE_ICONS: Record<Resource["type"], React.ReactNode> = {
  link: <Link2 className="w-4 h-4" />,
  file: <FileText className="w-4 h-4" />,
  note_doc: <FileText className="w-4 h-4" />,
};

const TYPE_LABELS: Record<Resource["type"], string> = {
  link: "Link",
  file: "File",
  note_doc: "Document",
};

interface TopicCanvasProps {
  topicId: string;
}

interface AddResourceDialogProps {
  topicId: string;
  onClose: () => void;
  onAdded: (resource: Resource) => void;
}

function AddResourceDialog({ topicId, onClose, onAdded }: AddResourceDialogProps) {
  const { addResource } = useStore();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<Resource["type"]>("link");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !user) return;
    setSaving(true);
    try {
      const resource = await addResource(
        {
          entityId: topicId,
          entityType: "topic",
          type,
          title: title.trim(),
          url: url.trim() || undefined,
        },
        user.id,
      );
      toast.success("Resource added");
      onAdded(resource);
      onClose();
    } catch {
      toast.error("Failed to add resource");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="res-title">Title</Label>
            <Input
              id="res-title"
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="Resource title"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="res-type">Type</Label>
            <Select value={type} onValueChange={value => setType(value as Resource["type"])}>
              <SelectTrigger id="res-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="link">Link</SelectItem>
                <SelectItem value="file">File</SelectItem>
                <SelectItem value="note_doc">Document</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(type === "link" || type === "file") && (
            <div className="space-y-1.5">
              <Label htmlFor="res-url">URL</Label>
              <Input
                id="res-url"
                value={url}
                onChange={event => setUrl(event.target.value)}
                placeholder="https://..."
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || saving}>
            {saving ? "Adding…" : "Add Resource"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResourcePreview({ resource }: { resource: Resource }) {
  const meta = parseResourceFileMeta(resource.content);

  if (meta?.mimeType === "image/png" && resource.url) {
    return (
      <img
        src={resource.url}
        alt={meta.fileName}
        className="block w-full rounded-b-xl object-contain max-h-[280px] bg-muted/30"
        draggable={false}
        onPointerDown={event => event.stopPropagation()}
      />
    );
  }

  if (meta?.mimeType === "application/pdf" && resource.url) {
    return (
      <iframe
        src={resource.url}
        title={meta.fileName}
        className="block w-full rounded-b-lg border-0 bg-muted/20"
        style={{ height: 400 }}
        onPointerDown={event => event.stopPropagation()}
      />
    );
  }

  if (meta && resource.url) {
    return (
      <div className="px-3 py-4 space-y-3">
        <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-3">
          <Presentation className="w-8 h-8 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{meta.fileName}</p>
            <p className="text-xs text-muted-foreground">PowerPoint presentation</p>
          </div>
        </div>
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          onPointerDown={event => event.stopPropagation()}
        >
          <ExternalLink className="w-3 h-3" />
          Open file
        </a>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{TYPE_LABELS[resource.type]}</span>
        <span>·</span>
        <span>{formatRelativeTime(resource.createdAt)}</span>
      </div>
      {resource.url ? (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-primary hover:underline truncate"
          onPointerDown={event => event.stopPropagation()}
        >
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{resource.url}</span>
        </a>
      ) : (
        <p className="text-xs text-muted-foreground">No URL attached</p>
      )}
    </div>
  );
}

interface CanvasNodeCardProps {
  node: CanvasNode;
  resource?: Resource;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDragStart: (event: ReactPointerEvent) => void;
  onNoteChange: (content: string) => void;
  onDeleteResource?: () => void;
}

function CanvasNodeCard({
  node,
  resource,
  isSelected,
  onSelect,
  onRemove,
  onDragStart,
  onNoteChange,
  onDeleteResource,
}: CanvasNodeCardProps) {
  const isNote = node.type === "note";

  return (
    <div
      className={cn(
        "absolute rounded-xl border bg-card text-card-foreground shadow-sm transition-shadow",
        isSelected && "ring-2 ring-primary/40 shadow-md",
      )}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        minHeight: node.height,
      }}
      onPointerDown={event => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <div
        className="flex items-center gap-2 border-b px-2 py-1.5 cursor-grab active:cursor-grabbing select-none"
        onPointerDown={onDragStart}
      >
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isNote ? (
            <>
              <StickyNote className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs font-medium text-muted-foreground truncate">Note</span>
            </>
          ) : (
            <>
              <div className="text-muted-foreground flex-shrink-0">
                {resource ? TYPE_ICONS[resource.type] : <Link2 className="w-3.5 h-3.5" />}
              </div>
              <span className="text-xs font-medium text-foreground truncate">
                {resource?.title ?? "Resource"}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {!isNote && onDeleteResource && (
            <button
              type="button"
              onPointerDown={event => event.stopPropagation()}
              onClick={onDeleteResource}
              className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete resource"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onPointerDown={event => event.stopPropagation()}
            onClick={onRemove}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title={isNote ? "Remove note" : "Remove from canvas"}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isNote ? (
        <Textarea
          value={(node as NoteNode).content}
          onChange={event => onNoteChange(event.target.value)}
          placeholder="Start writing..."
          className="min-h-[160px] resize-none border-0 bg-transparent px-3 py-3 text-sm leading-6 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          onPointerDown={event => event.stopPropagation()}
        />
      ) : resource ? (
        <ResourcePreview resource={resource} />
      ) : (
        <p className="px-3 py-3 text-xs text-muted-foreground">Resource no longer exists</p>
      )}
    </div>
  );
}

export function TopicCanvas({ topicId }: TopicCanvasProps) {
  const { topics, resources, updateTopic, fetchResources, deleteResource, addResource } = useStore();
  const { user } = useAuth();
  const topic = topics.find(item => item.id === topicId);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");
  const dragRef = useRef<{
    kind: "pan" | "node";
    pointerId: number;
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
    nodeId?: string;
  } | null>(null);

  const initialState = useMemo(
    () => parseTopicNotes(topic?.notes),
    [topic?.notes, topicId],
  );

  const [canvasState, setCanvasState] = useState<CanvasState>(initialState);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [spacePressed, setSpacePressed] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const topicResources = useMemo(
    () => resources.filter(resource => resource.entityId === topicId),
    [resources, topicId],
  );

  const resourcesById = useMemo(
    () => new Map(topicResources.map(resource => [resource.id, resource])),
    [topicResources],
  );

  useEffect(() => {
    if (user) fetchResources(topicId, user.id);
  }, [topicId, user, fetchResources]);

  useEffect(() => {
    const serialized = serializeCanvasState(initialState);
    if (serialized !== lastSavedRef.current) {
      setCanvasState(initialState);
      lastSavedRef.current = serialized;
    }
  }, [initialState, topicId]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" && !event.repeat) {
        const target = event.target as HTMLElement | null;
        if (target?.closest("textarea, input, select, [contenteditable=true]")) return;
        event.preventDefault();
        setSpacePressed(true);
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") setSpacePressed(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const persistCanvas = useCallback(
    (nextState: CanvasState) => {
      setSaveStatus("saving");
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const serialized = serializeCanvasState(nextState);
        lastSavedRef.current = serialized;
        try {
          await updateTopic(topicId, { notes: serialized });
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        } catch {
          setSaveStatus("idle");
        }
      }, 800);
    },
    [topicId, updateTopic],
  );

  const updateCanvas = useCallback(
    (updater: (state: CanvasState) => CanvasState) => {
      setCanvasState(current => {
        const next = updater(current);
        persistCanvas(next);
        return next;
      });
    },
    [persistCanvas],
  );

  const getViewportCenter = useCallback(() => {
    const container = containerRef.current;
    if (!container) return { x: 200, y: 200 };

    const { viewport } = canvasState;
    const centerX = (container.clientWidth / 2 - viewport.x) / viewport.zoom;
    const centerY = (container.clientHeight / 2 - viewport.y) / viewport.zoom;
    return { x: centerX - 150, y: centerY - 100 };
  }, [canvasState]);

  const addNote = useCallback(() => {
    const center = getViewportCenter();
    updateCanvas(state => ({
      ...state,
      nodes: [...state.nodes, createNoteNode(center.x, center.y)],
    }));
  }, [getViewportCenter, updateCanvas]);

  const addResourceToCanvas = useCallback(
    (
      resourceId: string,
      offset = 0,
      size?: { width: number; height: number },
    ) => {
      const center = getViewportCenter();
      updateCanvas(state => ({
        ...state,
        nodes: [
          ...state.nodes,
          createResourceNode(
            resourceId,
            center.x + offset,
            center.y + offset,
            size,
          ),
        ],
      }));
    },
    [getViewportCenter, updateCanvas],
  );

  const uploadFilesToCanvas = useCallback(
    async (files: FileList | File[]) => {
      if (!user) {
        toast.error("Sign in to upload files");
        return;
      }

      const fileList = Array.from(files);
      if (fileList.length === 0) return;

      setIsUploading(true);
      try {
        for (const [index, file] of fileList.entries()) {
          const payload = await uploadTopicResourceFile(file, topicId, user.id);
          const resource = await addResource(payload, user.id);
          const meta = parseResourceFileMeta(resource.content);
          const size = meta ? getResourceNodeSize(meta.mimeType) : undefined;
          addResourceToCanvas(resource.id, index * 28, size);
        }
        toast.success(
          fileList.length === 1
            ? "File imported to canvas"
            : `${fileList.length} files imported to canvas`,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to upload file";
        toast.error(message);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [addResource, addResourceToCanvas, topicId, user],
  );

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        void uploadFilesToCanvas(event.target.files);
      }
    },
    [uploadFilesToCanvas],
  );

  const handleCanvasDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleCanvasDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setIsDragOver(false);
  }, []);

  const handleCanvasDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      if (!event.dataTransfer.files.length) return;
      event.preventDefault();
      setIsDragOver(false);
      void uploadFilesToCanvas(event.dataTransfer.files);
    },
    [uploadFilesToCanvas],
  );

  const handleResourceAdded = useCallback(
    (resource: Resource) => {
      addResourceToCanvas(resource.id);
    },
    [addResourceToCanvas],
  );

  const removeNode = useCallback(
    (nodeId: string) => {
      updateCanvas(state => ({
        ...state,
        nodes: state.nodes.filter(node => node.id !== nodeId),
      }));
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    },
    [selectedNodeId, updateCanvas],
  );

  const handleDeleteResource = useCallback(
    async (node: ResourceNode) => {
      try {
        await deleteResource(node.resourceId);
        removeNode(node.id);
        toast.success("Resource removed");
      } catch {
        toast.error("Failed to remove resource");
      }
    },
    [deleteResource, removeNode],
  );

  const handleWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      updateCanvas(state => {
        const zoomFactor = event.deltaY < 0 ? 1.08 : 0.92;
        const nextZoom = clampZoom(state.viewport.zoom * zoomFactor);
        const worldX = (mouseX - state.viewport.x) / state.viewport.zoom;
        const worldY = (mouseY - state.viewport.y) / state.viewport.zoom;

        return {
          ...state,
          viewport: {
            x: mouseX - worldX * nextZoom,
            y: mouseY - worldY * nextZoom,
            zoom: nextZoom,
          },
        };
      });
    },
    [updateCanvas],
  );

  const handleCanvasPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 && event.button !== 1) return;
      const shouldPan = spacePressed || event.button === 1;
      if (!shouldPan) {
        setSelectedNodeId(null);
        return;
      }

      event.preventDefault();
      dragRef.current = {
        kind: "pan",
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originX: canvasState.viewport.x,
        originY: canvasState.viewport.y,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [canvasState.viewport.x, canvasState.viewport.y, spacePressed],
  );

  const handleNodeDragStart = useCallback(
    (node: CanvasNode, event: ReactPointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setSelectedNodeId(node.id);
      dragRef.current = {
        kind: "node",
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originX: node.x,
        originY: node.y,
        nodeId: node.id,
      };
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - drag.startClientX;
      const deltaY = event.clientY - drag.startClientY;

      if (drag.kind === "pan") {
        setCanvasState(current => ({
          ...current,
          viewport: {
            ...current.viewport,
            x: drag.originX + deltaX,
            y: drag.originY + deltaY,
          },
        }));
        return;
      }

      if (drag.kind === "node" && drag.nodeId) {
        setCanvasState(current => ({
          ...current,
          nodes: current.nodes.map(node =>
            node.id === drag.nodeId
              ? {
                  ...node,
                  x: drag.originX + deltaX / current.viewport.zoom,
                  y: drag.originY + deltaY / current.viewport.zoom,
                }
              : node,
          ),
        }));
      }
    },
    [],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      if (drag.kind === "node") {
        setCanvasState(current => {
          persistCanvas(current);
          return current;
        });
      } else if (drag.kind === "pan") {
        setCanvasState(current => {
          persistCanvas(current);
          return current;
        });
      }

      dragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    },
    [persistCanvas],
  );

  const zoomBy = useCallback(
    (factor: number) => {
      const container = containerRef.current;
      updateCanvas(state => {
        if (!container) {
          return {
            ...state,
            viewport: {
              ...state.viewport,
              zoom: clampZoom(state.viewport.zoom * factor),
            },
          };
        }

        const mouseX = container.clientWidth / 2;
        const mouseY = container.clientHeight / 2;
        const nextZoom = clampZoom(state.viewport.zoom * factor);
        const worldX = (mouseX - state.viewport.x) / state.viewport.zoom;
        const worldY = (mouseY - state.viewport.y) / state.viewport.zoom;

        return {
          ...state,
          viewport: {
            x: mouseX - worldX * nextZoom,
            y: mouseY - worldY * nextZoom,
            zoom: nextZoom,
          },
        };
      });
    },
    [updateCanvas],
  );

  if (!topic) return null;

  return (
    <div className="relative flex-1 min-h-[60vh] overflow-hidden bg-muted/20">
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-lg border bg-background/95 p-1 shadow-sm backdrop-blur">
        <Button variant="ghost" size="sm" className="h-8 px-2.5" onClick={addNote}>
          <StickyNote className="w-3.5 h-3.5 mr-1.5" />
          Note
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2.5"
          onClick={() => setShowAddResource(true)}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Resource
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_UPLOAD_INPUT}
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2.5"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5 mr-1.5" />
          )}
          Import
        </Button>
        <div className="mx-1 h-5 w-px bg-border" />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomBy(1.12)}>
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomBy(0.89)}>
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <span className="px-1 text-xs text-muted-foreground tabular-nums">
          {Math.round(canvasState.viewport.zoom * 100)}%
        </span>
      </div>

      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-lg border bg-background/95 px-2.5 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur pointer-events-none">
        {saveStatus === "saving" && (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Saving…</span>
          </>
        )}
        {saveStatus === "saved" && (
          <>
            <Check className="w-3 h-3 text-green-500" />
            <span className="text-green-500">Saved</span>
          </>
        )}
        {saveStatus === "idle" && (
          <span>Import PNG/PDF/PPTX · Space + drag to pan · Scroll to zoom</span>
        )}
      </div>

      <div
        ref={containerRef}
        className={cn(
          "absolute inset-0 touch-none",
          spacePressed ? "cursor-grab active:cursor-grabbing" : "cursor-default",
        )}
        onWheel={handleWheel}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDragOver={handleCanvasDragOver}
        onDragLeave={handleCanvasDragLeave}
        onDrop={handleCanvasDrop}
      >
        {isDragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary pointer-events-none">
            <div className="rounded-lg bg-background/95 px-4 py-3 text-sm font-medium shadow-sm">
              Drop PNG, PDF, or PPTX to import
            </div>
          </div>
        )}
        <div
          className="absolute inset-0 origin-top-left"
          style={{
            transform: `translate(${canvasState.viewport.x}px, ${canvasState.viewport.y}px) scale(${canvasState.viewport.zoom})`,
          }}
        >
          <div
            className="absolute -left-[5000px] -top-[5000px] h-[10000px] w-[10000px]"
            style={{
              backgroundImage:
                "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {canvasState.nodes.map(node => (
            <CanvasNodeCard
              key={node.id}
              node={node}
              resource={
                node.type === "resource"
                  ? resourcesById.get(node.resourceId)
                  : undefined
              }
              isSelected={selectedNodeId === node.id}
              onSelect={() => setSelectedNodeId(node.id)}
              onRemove={() => removeNode(node.id)}
              onDragStart={event => handleNodeDragStart(node, event)}
              onNoteChange={content =>
                updateCanvas(state => ({
                  ...state,
                  nodes: state.nodes.map(item =>
                    item.id === node.id && item.type === "note"
                      ? { ...item, content }
                      : item,
                  ),
                }))
              }
              onDeleteResource={
                node.type === "resource"
                  ? () => handleDeleteResource(node)
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {showAddResource && (
        <AddResourceDialog
          topicId={topicId}
          onClose={() => setShowAddResource(false)}
          onAdded={handleResourceAdded}
        />
      )}
    </div>
  );
}
