"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Clock } from "lucide-react";
import type { Visibility } from "@/lib/docs-utils";

interface VisibilityPanelProps {
  visibility: Visibility | null;
  onUpdate: (data: Partial<Visibility>) => Promise<void>;
  docsUrl: string;
}

export function VisibilityPanel({
  visibility,
  onUpdate,
  docsUrl,
}: VisibilityPanelProps) {
  const [isPublic, setIsPublic] = useState(visibility?.is_public ?? false);
  const [startAt, setStartAt] = useState(
    visibility?.start_at
      ? new Date(visibility.start_at).toISOString().slice(0, 16)
      : ""
  );
  const [endAt, setEndAt] = useState(
    visibility?.end_at
      ? new Date(visibility.end_at).toISOString().slice(0, 16)
      : ""
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onUpdate({
      is_public: isPublic,
      start_at: startAt ? new Date(startAt).toISOString() : null,
      end_at: endAt ? new Date(endAt).toISOString() : null,
    });
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Publishing Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <div className="text-sm font-medium text-foreground">
              Public Access
            </div>
            <div className="text-xs text-muted-foreground">
              When enabled, the docs page is accessible at the public URL
            </div>
          </div>
          <Switch checked={isPublic} onCheckedChange={setIsPublic} />
        </div>

        {/* Schedule */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="start_at">Start Date & Time</Label>
            <Input
              id="start_at"
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_at">End Date & Time</Label>
            <Input
              id="end_at"
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
            View live docs
          </a>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
