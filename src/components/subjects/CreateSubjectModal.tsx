"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_SUBJECT_COLORS, DEFAULT_SUBJECT_ICONS } from '@/lib/constants';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CreateSubjectModal({ onClose }: { onClose: () => void }) {
  const { addSubject } = useStore();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(DEFAULT_SUBJECT_COLORS[0]);
  const [icon, setIcon] = useState(DEFAULT_SUBJECT_ICONS[0]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;
    setSubmitting(true);
    try {
      await addSubject({ name: name.trim(), description: description.trim() || undefined, color, icon }, user.id);
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">New Subject</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Name</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Machine Learning"
              className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Description</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description"
              className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_SUBJECT_ICONS.map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={cn(
                    'w-8 h-8 rounded-md flex items-center justify-center text-sm transition-colors',
                    icon === i ? 'bg-accent ring-1 ring-ring' : 'hover:bg-accent/50'
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">Color</label>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_SUBJECT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-6 h-6 rounded-full transition-transform',
                    color === c ? 'ring-2 ring-ring ring-offset-2 ring-offset-card scale-110' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!name.trim() || submitting} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
              {submitting ? 'Creating…' : 'Create Subject'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
