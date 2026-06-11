"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import type { ChangelogEntry } from "@/lib/docs-utils";
import type { Json } from "@/integrations/supabase/types";

interface ChangelogManagerProps {
  entries: ChangelogEntry[];
  onCreate: (data: {
    version: string;
    date: string;
    changes: Json;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ChangelogManager({
  entries,
  onCreate,
  onDelete,
}: ChangelogManagerProps) {
  const [newOpen, setNewOpen] = useState(false);
  const [newVersion, setNewVersion] = useState("");
  const [newDate, setNewDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [newChanges, setNewChanges] = useState("");

  async function handleCreate() {
    if (!newVersion || !newChanges) return;
    const changes = newChanges
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => l.replace(/^[-*]\s*/, ""));
    await onCreate({
      version: newVersion,
      date: newDate,
      changes: changes as unknown as Json,
    });
    setNewVersion("");
    setNewDate(new Date().toISOString().split("T")[0]);
    setNewChanges("");
    setNewOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {entries.length} version{entries.length !== 1 ? "s" : ""}
        </p>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Add Version
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Changelog Version</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Version (e.g., v0.5.0)"
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
              />
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Changes (one per line)
                </label>
                <Textarea
                  placeholder="- Added new feature&#10;- Fixed bug"
                  value={newChanges}
                  onChange={(e) => setNewChanges(e.target.value)}
                  rows={6}
                />
              </div>
              <Button onClick={handleCreate}>Add Entry</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => {
          const changes = entry.changes as string[];
          return (
            <div
              key={entry.id}
              className="flex items-start gap-4 rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {entry.version}
                  </Badge>
                  <time className="text-xs text-muted-foreground">
                    {entry.date}
                  </time>
                </div>
                {Array.isArray(changes) && (
                  <ul className="mt-2 space-y-0.5">
                    {changes.map((change, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        • {change}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={() => onDelete(entry.id)}
                className="shrink-0 text-destructive hover:text-destructive/80"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
