import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  isRoot: boolean;
  onCreateFolder: () => void;
  onUploadFile: () => void;
}

export function EmptyState({ isRoot, onCreateFolder, onUploadFile }: EmptyStateProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <FolderOpen className="h-12 w-12 text-muted-foreground/40" />
      <h2 className="text-lg font-medium text-foreground">
        {isRoot ? "No materials yet" : "This folder is empty"}
      </h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {isRoot
          ? "Create folders, upload files, or add links to organize your study materials."
          : "Add files, folders, or links to this folder."}
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={onCreateFolder}>
          New Folder
        </Button>
        <Button size="sm" variant="outline" onClick={onUploadFile}>
          Upload File
        </Button>
      </div>
    </div>
  );
}
