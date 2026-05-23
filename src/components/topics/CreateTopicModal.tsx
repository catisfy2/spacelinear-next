"use client";

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Sparkles } from 'lucide-react';

export function CreateTopicModal({ onClose }: { onClose: () => void }) {
  const { addTopic, subjects } = useStore();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;
    setSubmitting(true);
    try {
      const topic = await addTopic({
        title: title.trim(),
        description: undefined,
        notes: undefined,
        subjectId,
        tags: [],
      }, user.id);

      const subject = subjects.find(s => s.id === subjectId);
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (accessToken) {
        fetch('/api/topics/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topicId: topic.id,
            title: topic.title,
            subjectName: subject?.name ?? null,
            accessToken,
          }),
        });
      }

      toast.success('Topic created! Generating AI description...');
      onClose();
    } catch {
      toast.error('Failed to create topic');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">New Topic</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Title</label>
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Attention Mechanism"
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Subject</label>
              <select
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">None (no subject)</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                ))}
              </select>
            </div>
            <div className="bg-muted/50 rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                AI will generate a description and tags after creation
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={!title.trim() || submitting} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                {submitting ? 'Creating…' : 'Create Topic'}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
}
