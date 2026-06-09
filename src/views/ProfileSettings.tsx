"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User, Loader2, Monitor, Moon, Sun } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { applyThemeMode, getStoredThemeMode, subscribeSystemTheme, type ThemeMode } from '@/lib/theme';

export function ProfileSettings() {
  const { user } = useAuth();
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name || user?.email || '',
  );
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    setThemeMode(getStoredThemeMode());
  }, []);

  useEffect(() => {
    if (themeMode !== 'system') return;
    return subscribeSystemTheme(() => applyThemeMode('system'));
  }, [themeMode]);

  const setTheme = (mode: ThemeMode) => {
    applyThemeMode(mode);
    setThemeMode(mode);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName },
      });
      if (error) throw error;
      toast('Profile updated');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      toast(message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast('Password must be at least 6 characters');
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast('Password updated');
      setNewPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      toast(message);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Account
          </CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ''} disabled className="opacity-60" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} size="sm">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border">
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Theme follows your choice or the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={themeMode}
            onValueChange={(v) => setTheme(v as ThemeMode)}
            className="grid gap-3 sm:grid-cols-3"
          >
            <label
              htmlFor="theme-light"
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-accent/50"
            >
              <RadioGroupItem value="light" id="theme-light" />
              <Sun className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Light</span>
            </label>
            <label
              htmlFor="theme-dark"
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-accent/50"
            >
              <RadioGroupItem value="dark" id="theme-dark" />
              <Moon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Dark</span>
            </label>
            <label
              htmlFor="theme-system"
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-accent/50"
            >
              <RadioGroupItem value="system" id="theme-system" />
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">System</span>
            </label>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border">
        <CardHeader>
          <CardTitle className="text-base">Security</CardTitle>
          <CardDescription>Update your password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
            />
          </div>
          <Button onClick={handleChangePassword} disabled={changingPassword} size="sm" variant="secondary">
            {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
