import { useState, useRef, useCallback } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface UploadButtonProps {
  onUpload: (files: FileList) => Promise<void>;
}

export function UploadButton({ onUpload }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(async (files: FileList) => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      await onUpload(files);
      toast.success(`Uploaded ${files.length} file(s)`);
    } catch (err) {
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length > 0) {
            await handleFiles(e.dataTransfer.files);
          }
        }}
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/30"
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drop files here or click to browse
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              Browse Files
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
