"use client";

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { formatNextReview } from '@/lib/constants';
import { ArrowLeft, Flame, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
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

export function SubjectPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const { subjects, topics, reviewHistory, deleteSubject, updateSubject } = useStore();
  const subject = subjects.find(s => s.id === id);
  const subjectTopics = useMemo(() => topics.filter(t => t.subjectId === id), [topics, id]);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Subject not found</p>
        <Link href="/topics" className="text-primary text-sm hover:underline">Back to Topics</Link>
      </div>
    );
  }

  const startEditing = () => {
    setEditName(subject.name);
    setEditDescription(subject.description || '');
    setEditIcon(subject.icon);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!editName.trim() || !id) return;
    await updateSubject(id, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      icon: editIcon || '📘',
    });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteSubject(id);
    router.replace('/topics');
  };

  const dueCount = subjectTopics.filter(t => new Date(t.nextReviewDate) <= new Date()).length;
  const easyCount = subjectTopics.filter(t => t.currentDifficulty === 'easy').length;
  const medCount = subjectTopics.filter(t => t.currentDifficulty === 'medium').length;
  const hardCount = subjectTopics.filter(t => t.currentDifficulty === 'hard').length;
  const relearnCount = subjectTopics.filter(t => t.state === 'relearning').length;
  const newCount = subjectTopics.filter(t => t.state === 'new').length;
  const mastery = subjectTopics.length > 0 ? Math.round((easyCount / subjectTopics.length) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <Link href="/topics" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> All Topics
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {editing ? (
          <>
            <input
              value={editIcon}
              onChange={e => setEditIcon(e.target.value)}
              className="text-4xl w-14 h-14 text-center bg-secondary border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="flex-1 space-y-2">
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full text-2xl font-semibold bg-secondary border border-border rounded-md px-3 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full text-sm bg-secondary border border-border rounded-md px-3 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={!editName.trim()} className="px-3 py-1 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Save</button>
                <button onClick={() => setEditing(false)} className="px-3 py-1 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent">Cancel</button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-4xl">{subject.icon}</div>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-foreground">{subject.name}</h1>
              {subject.description && <p className="text-sm text-muted-foreground mt-1">{subject.description}</p>}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-md hover:bg-accent text-muted-foreground">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={startEditing}>
                  <Pencil className="w-4 h-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{subject.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this subject and all {subjectTopics.length} topic{subjectTopics.length !== 1 ? 's' : ''} within it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{subjectTopics.length}</div>
          <div className="text-xs text-muted-foreground">Total topics</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{dueCount}</div>
          <div className="text-xs text-muted-foreground">Due today</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{mastery}%</div>
          <div className="text-xs text-muted-foreground">Mastered</div>
        </div>
      </div>

      {/* Retention Distribution */}
      {subjectTopics.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5 mb-6">
          <h3 className="text-sm font-medium text-foreground mb-3">Retention Distribution</h3>
          <div className="flex gap-1 h-5 rounded overflow-hidden">
            {easyCount > 0 && <div className="bg-sl-easy" style={{ flex: easyCount }} />}
            {medCount > 0 && <div className="bg-sl-medium" style={{ flex: medCount }} />}
            {hardCount > 0 && <div className="bg-sl-hard" style={{ flex: hardCount }} />}
            {relearnCount > 0 && <div className="bg-sl-relearn" style={{ flex: relearnCount }} />}
            {newCount > 0 && <div className="bg-muted-foreground/30" style={{ flex: newCount }} />}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span>Easy {easyCount}</span>
            <span>Medium {medCount}</span>
            <span>Hard {hardCount}</span>
            <span>Relearn {relearnCount}</span>
            <span>New {newCount}</span>
          </div>
        </div>
      )}

      {/* Topics list */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Topics ({subjectTopics.length})</h3>
        </div>
        {subjectTopics.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No topics in this subject yet</div>
        ) : (
          subjectTopics.map(topic => (
            <div key={topic.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0 text-sm hover:bg-accent/30 transition-colors">
              <span className="text-foreground flex-1">{topic.title}</span>
              <span className="text-xs text-muted-foreground font-mono">{formatNextReview(topic.nextReviewDate)}</span>
              {topic.streak > 2 && (
                <span className="flex items-center gap-0.5 text-xs text-sl-hard">
                  <Flame className="w-3 h-3" />{topic.streak}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
