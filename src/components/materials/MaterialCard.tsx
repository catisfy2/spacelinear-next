import { Folder, File, Link, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/constants";
import { MaterialContextMenu } from "./MaterialContextMenu";
import type { Material } from "@/lib/types";

interface MaterialCardProps {
  material: Material;
  onNavigate: (folderId: string) => void;
  onRename: () => void;
  onDelete: () => void;
  onToggleStar: () => void;
  onMove: () => void;
}

function getTypeIcon(type: string) {
  switch (type) {
    case "folder":
      return <Folder className="h-8 w-8 text-amber-500" />;
    case "file":
      return <File className="h-8 w-8 text-blue-500" />;
    case "link":
      return <Link className="h-8 w-8 text-green-500" />;
    case "text":
      return <FileText className="h-8 w-8 text-purple-500" />;
    default:
      return <File className="h-8 w-8 text-muted-foreground" />;
  }
}

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MaterialCard({
  material,
  onNavigate,
  onRename,
  onDelete,
  onToggleStar,
  onMove,
}: MaterialCardProps) {
  const isFolder = material.type === "folder";

  return (
    <div
      onClick={() => isFolder && onNavigate(material.id)}
      className={cn(
        "group relative flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 transition-colors",
        isFolder
          ? "cursor-pointer hover:bg-accent/50"
          : "cursor-default",
      )}
    >
      {/* Star indicator */}
      {material.isStarred && (
        <div className="absolute right-2 top-2">
          <div className="h-2 w-2 rounded-full bg-yellow-500" />
        </div>
      )}

      {/* Context menu */}
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <MaterialContextMenu
          material={material}
          onRename={onRename}
          onDelete={onDelete}
          onToggleStar={onToggleStar}
          onMove={onMove}
        />
      </div>

      {/* Icon */}
      <div className="mt-4">{getTypeIcon(material.type)}</div>

      {/* Name */}
      <p className="max-w-full truncate text-center text-sm font-medium text-foreground px-1">
        {material.name}
      </p>

      {/* Meta */}
      <p className="text-xs text-muted-foreground">
        {material.type === "file" && material.fileSize
          ? formatSize(material.fileSize)
          : formatRelativeTime(material.updatedAt)}
      </p>
    </div>
  );
}
