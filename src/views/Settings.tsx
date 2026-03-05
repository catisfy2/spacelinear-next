"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { LogOut, User, Moon, Sun, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useRouter } from 'next/navigation';

function useTheme() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('sl-theme');
    if (stored) return stored === 'dark';
    return true; // default dark
  });

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('sl-theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('light', !next);
    document.documentElement.classList.toggle('dark', next);
  };

  return { dark, toggle };
}

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { dark, toggle } = useTheme();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || user?.email || '');
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName },
      });
      if (error) throw error;
      toast('Profile updated');
    } catch (err: any) {
      toast(err.message || 'Failed to update profile');
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
    } catch (err: any) {
      toast(err.message || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/auth');
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      <Separator />

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ''} disabled className="opacity-60" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} size="sm">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {dark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            Appearance
          </CardTitle>
          <CardDescription>Customize the look of the app</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Toggle between light and dark themes</p>
            </div>
            <Switch checked={dark} onCheckedChange={toggle} />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Security</CardTitle>
          <CardDescription>Update your password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
            />
          </div>
          <Button onClick={handleChangePassword} disabled={changingPassword} size="sm" variant="secondary">
            {changingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="border-destructive/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Log Out</p>
              <p className="text-xs text-muted-foreground">Sign out of your account</p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Log Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
