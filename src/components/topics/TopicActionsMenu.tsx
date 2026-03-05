"use client";

import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface TopicActionsMenuProps {
  topicId: string;
  onDeleted?: () => void;
}

export function TopicActionsMenu({ topicId, onDeleted }: TopicActionsMenuProps) {
  const { topics, updateTopic, deleteTopic } = useStore();
  const router = useRouter();
  const topic = topics.find(t => t.id === topicId);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!topic) return null;

  const handleStartEdit = () => {
    setEditTitle(topic.title);
    setEditDescription(topic.description ?? '');
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    setIsUpdating(true);
    try {
      await updateTopic(topic.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      });
      setShowEditDialog(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTopic(topic.id);
      setShowDeleteDialog(false);
      if (onDeleted) {
        onDeleted();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title="More actions"
            className="p-2 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleStartEdit}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit topic
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2 text-[rgba(192,53,53,1)]" />
            Delete topic
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit dialog */}
      <AlertDialog
        open={showEditDialog}
        onOpenChange={open => {
          if (isUpdating) return;
          setShowEditDialog(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit topic</AlertDialogTitle>
            <AlertDialogDescription>
              Update the title and description for this topic.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Title
              </label>
              <Input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                disabled={isUpdating}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Description
              </label>
              <Textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                rows={3}
                placeholder="Add a description..."
                disabled={isUpdating}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSave}
              disabled={isUpdating || !editTitle.trim()}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? 'Saving…' : 'Save'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={open => {
          if (isDeleting) return;
          setShowDeleteDialog(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete topic</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this topic and its review history. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

