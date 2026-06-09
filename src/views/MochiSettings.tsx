"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface MochiSettingsData {
  enabled: boolean;
  tone: "friendly" | "professional";
  maxCrons: number;
}

export function MochiSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<MochiSettingsData>({
    enabled: true,
    tone: "friendly",
    maxCrons: 3,
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("mochi_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (data) {
          setSettings({
            enabled: data.enabled,
            tone: data.tone as "friendly" | "professional",
            maxCrons: data.max_crons,
          });
        } else {
          const { data: inserted } = await supabase
            .from("mochi_settings")
            .insert({ user_id: user.id })
            .select()
            .single();

          if (!cancelled && inserted) {
            setSettings({
              enabled: inserted.enabled,
              tone: inserted.tone as "friendly" | "professional",
              maxCrons: inserted.max_crons,
            });
          }
        }
      } catch {
        toast("Failed to load Mochi settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const updateField = <K extends keyof MochiSettingsData>(
    key: K,
    value: MochiSettingsData[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("mochi_settings")
        .upsert({
          user_id: user.id,
          enabled: settings.enabled,
          tone: settings.tone,
          max_crons: settings.maxCrons,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast("Mochi settings saved");
      setHasChanges(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save Mochi settings";
      toast(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            Mochi Settings
          </CardTitle>
          <CardDescription>
            Configure your AI study companion behavior.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="mochi-enabled">Enable Mochi</Label>
              <p className="text-sm text-muted-foreground">
                Allow Mochi to send proactive study reminders and suggestions.
              </p>
            </div>
            <Switch
              id="mochi-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => updateField("enabled", checked)}
            />
          </div>

          <div className="space-y-3">
            <Label>Tone</Label>
            <RadioGroup
              value={settings.tone}
              onValueChange={(v) => updateField("tone", v as "friendly" | "professional")}
              className="grid gap-3 sm:grid-cols-2"
            >
              <label
                htmlFor="tone-friendly"
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-accent/50"
              >
                <RadioGroupItem value="friendly" id="tone-friendly" />
                <span className="text-sm font-medium">Friendly</span>
              </label>
              <label
                htmlFor="tone-professional"
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-accent/50"
              >
                <RadioGroupItem value="professional" id="tone-professional" />
                <span className="text-sm font-medium">Professional</span>
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-crons">Max scheduled reminders</Label>
            <p className="text-sm text-muted-foreground">
              Maximum number of active cron-based reminders (0–10).
            </p>
            <Input
              id="max-crons"
              type="number"
              min={0}
              max={10}
              value={settings.maxCrons}
              onChange={(e) => updateField("maxCrons", Math.min(10, Math.max(0, Number(e.target.value))))}
              className="w-24"
            />
          </div>

          <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
