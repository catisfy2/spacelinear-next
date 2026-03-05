import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import type { Resource } from '@/lib/types';
import { Link2, FileText, Plus, Trash2, ExternalLink } from 'lucide-react';
import { formatRelativeTime } from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const TYPE_ICONS: Record<Resource['type'], React.ReactNode> = {
  link: <Link2 className="w-4 h-4" />,
  file: <FileText className="w-4 h-4" />,
  note_doc: <FileText className="w-4 h-4" />,
};

const TYPE_LABELS: Record<Resource['type'], string> = {
  link: 'Link',
  file: 'File',
  note_doc: 'Document',
};

interface AddResourceDialogProps {
  topicId: string;
  onClose: () => void;
}

function AddResourceDialog({ topicId, onClose }: AddResourceDialogProps) {
  const { addResource } = useStore();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Resource['type']>('link');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !user) return;
    setSaving(true);
    try {
      await addResource(
        {
          entityId: topicId,
          entityType: 'topic',
          type,
          title: title.trim(),
          url: url.trim() || undefined,
        },
        user.id,
      );
      toast.success('Resource added');
      onClose();
    } catch {
      toast.error('Failed to add resource');
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
              onChange={e => setTitle(e.target.value)}
              placeholder="Resource title"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="res-type">Type</Label>
            <Select value={type} onValueChange={v => setType(v as Resource['type'])}>
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
          {(type === 'link' || type === 'file') && (
            <div className="space-y-1.5">
              <Label htmlFor="res-url">URL</Label>
              <Input
                id="res-url"
                value={url}
                onChange={e => setUrl(e.target.value)}
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
            {saving ? 'Adding…' : 'Add Resource'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TopicResourcesProps {
  topicId: string;
}

export function TopicResources({ topicId }: TopicResourcesProps) {
  const { resources, fetchResources, deleteResource } = useStore();
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (user) fetchResources(topicId, user.id);
  }, [topicId, user]);

  const topicResources = resources.filter(r => r.entityId === topicId);

  const handleDelete = async (id: string) => {
    await deleteResource(id);
    toast.success('Resource removed');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {topicResources.length === 0
            ? 'No resources yet'
            : `${topicResources.length} resource${topicResources.length > 1 ? 's' : ''}`}
        </p>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Resource
        </button>
      </div>

      {topicResources.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {topicResources.map(resource => (
            <div
              key={resource.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors group"
            >
              <div className="p-1.5 rounded-md bg-accent text-muted-foreground flex-shrink-0 mt-0.5">
                {TYPE_ICONS[resource.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{resource.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{TYPE_LABELS[resource.type]}</span>
                  <span className="text-muted-foreground/40 text-xs">·</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(resource.createdAt)}
                  </span>
                </div>
                {resource.url && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline mt-1 truncate"
                  >
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{resource.url}</span>
                  </a>
                )}
              </div>
              <button
                onClick={() => handleDelete(resource.id)}
                className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {topicResources.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-3 rounded-full bg-accent mb-3">
            <Link2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No resources yet</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Add links, files, or documents related to this topic.
          </p>
        </div>
      )}

      {showAdd && <AddResourceDialog topicId={topicId} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
