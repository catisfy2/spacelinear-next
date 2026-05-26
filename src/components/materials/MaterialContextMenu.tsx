import {
  Folder,
  File,
  Link,
  FileText,
  Star,
  StarOff,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  Move,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Material } from "@/lib/types";

interface MaterialContextMenuProps {
  material: Material;
  onRename: () => void;
  onDelete: () => void;
  onToggleStar: () => void;
  onMove: () => void;
}

export function MaterialContextMenu({
  material,
  onRename,
  onDelete,
  onToggleStar,
  onMove,
}: MaterialContextMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {material.type === "folder" ? (
          <DropdownMenuItem onClick={onRename}>
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onRename}>
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onToggleStar}>
          {material.isStarred ? (
            <>
              <StarOff className="mr-2 h-4 w-4" />
              Unstar
            </>
          ) : (
            <>
              <Star className="mr-2 h-4 w-4" />
              Star
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onMove}>
          <Move className="mr-2 h-4 w-4" />
          Move
        </DropdownMenuItem>
        {material.type === "file" && material.url && (
          <DropdownMenuItem
            onClick={() => window.open(material.url, "_blank")}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
        )}
        {material.type === "link" && material.url && (
          <DropdownMenuItem
            onClick={() => window.open(material.url, "_blank")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Link
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Move to Trash
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
