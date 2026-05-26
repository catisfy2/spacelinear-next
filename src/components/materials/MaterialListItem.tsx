import { Folder, File, Link, FileText, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/constants";
import { MaterialContextMenu } from "./MaterialContextMenu";
import type { Material } from "@/lib/types";

interface MaterialListItemProps {
  material: Material;
  onNavigate: (folderId: string) => void;
  onRename: () => void;
  onDelete: () => void;
  onToggleStar: () => void;
  onMove: () => void;
}

function getTypeIcon(type: string, className = "h-4 w-4") {
  switch (type) {
    case "folder":
      return <Folder className={cn(className, "text-amber-500")} />;
    case "file":
      return <File className={cn(className, "text-blue-500")} />;
    case "link":
      return <Link className={cn(className, "text-green-500")} />;
    case "text":
      return <FileText className={cn(className, "text-purple-500")} />;
    default:
      return <File className={cn(className, "text-muted-foreground")} />;
  }
}

function formatSize(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MaterialListItem({
  material,
  onNavigate,
  onRename,
  onDelete,
  onToggleStar,
  onMove,
}: MaterialListItemProps) {
  const isFolder = material.type === "folder";

  return (
    <div
      onClick={() => isFolder && onNavigate(material.id)}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 transition-colors",
        isFolder ? "cursor-pointer hover:bg-accent/50" : "cursor-default",
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0">{getTypeIcon(material.type, "h-5 w-5")}</div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{material.name}</p>
      </div>

      {/* Type */}
      <span className="hidden sm:inline text-xs text-muted-foreground w-16 capitalize">
        {material.type}
      </span>

      {/* Size */}
      <span className="hidden md:inline text-xs text-muted-foreground w-20 text-right">
        {material.type === "file" ? formatSize(material.fileSize) : "—"}
      </span>

      {/* Updated */}
      <span className="hidden lg:inline text-xs text-muted-foreground w-28 text-right">
        {formatRelativeTime(material.updatedAt)}
      </span>

      {/* Star */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar();
        }}
        className={cn(
          "flex-shrink-0 p-1 rounded transition-colors",
          material.isStarred
            ? "text-yellow-500"
            : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:opacity-100",
        )}
      >
        <Star className="h-4 w-4" fill={material.isStarred ? "currentColor" : "none"} />
      </button>

      {/* Actions */}
      <MaterialContextMenu
        material={material}
        onRename={onRename}
        onDelete={onDelete}
        onToggleStar={onToggleStar}
        onMove={onMove}
      />
    </div>
  );
}
