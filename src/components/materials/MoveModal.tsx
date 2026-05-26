import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronRight, Folder, Home } from "lucide-react";
import type { Material } from "@/lib/types";

interface MoveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentParentId: string | null;
  itemName: string;
  onSubmit: (newParentId: string | null) => Promise<void>;
}

export function MoveModal({ open, onOpenChange, currentParentId, itemName, onSubmit }: MoveModalProps) {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Material[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Material[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(currentParentId);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      loadFolders(null);
      setCurrentFolder(null);
      setBreadcrumbs([]);
      setSelectedParentId(currentParentId);
    }
  }, [open, user]);

  const loadFolders = async (parentId: string | null) => {
    if (!user) return;
    let query = supabase
      .from("materials")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "folder")
      .is("deleted_at", null);

    if (parentId === null) {
      query = query.is("parent_id", null);
    } else {
      query = query.eq("parent_id", parentId);
    }

    const { data } = await query.order("name");
    setFolders((data ?? []) as unknown as Material[]);
  };

  const navigateToFolder = async (folderId: string | null) => {
    setCurrentFolder(folderId);
    await loadFolders(folderId);

    if (folderId === null) {
      setBreadcrumbs([]);
    } else {
      // Fetch the folder name for breadcrumb
      const { data } = await supabase
        .from("materials")
        .select("name")
        .eq("id", folderId)
        .single();
      if (data) {
        const crumb = { id: folderId, name: data.name } as Material;
        setBreadcrumbs((prev) => [...prev, crumb]);
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(selectedParentId);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move "{itemName}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {/* Breadcrumb / Current location */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <button
              onClick={() => {
                setCurrentFolder(null);
                setBreadcrumbs([]);
                loadFolders(null);
              }}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:text-foreground hover:bg-accent"
            >
              <Home className="h-3 w-3" />
            </button>
            {breadcrumbs.map((crumb) => (
              <span key={crumb.id} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground">{crumb.name}</span>
              </span>
            ))}
          </div>

          <ScrollArea className="h-48 rounded-md border">
            <div className="p-1 space-y-0.5">
              {currentFolder !== null && (
                <button
                  onClick={() => {
                    const parent = breadcrumbs[breadcrumbs.length - 2];
                    navigateToFolder(parent?.id ?? null);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <ChevronRight className="h-4 w-4 rotate-180 text-muted-foreground" />
                  <span className="text-muted-foreground">..</span>
                </button>
              )}
              {folders.length === 0 && (
                <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No subfolders
                </p>
              )}
              {folders.map((folder) => (
                <div key={folder.id} className="flex items-center">
                  <button
                    onClick={() => navigateToFolder(folder.id)}
                    className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Folder className="h-4 w-4 text-amber-500" />
                    <span className="truncate">{folder.name}</span>
                  </button>
                  <button
                    onClick={() => setSelectedParentId(folder.id)}
                    className={cn(
                      "rounded-md px-2 py-1.5 text-xs transition-colors",
                      selectedParentId === folder.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent",
                    )}
                  >
                    Move here
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {selectedParentId === null
              ? "Will be moved to root"
              : "Selected folder ready"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Moving..." : "Move"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
