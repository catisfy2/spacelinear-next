"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Trash2 } from "lucide-react";
import type { TeamMember } from "@/lib/docs-utils";

interface TeamManagerProps {
  team: TeamMember[];
  onUpdate: (id: string, data: Partial<TeamMember>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCreate: (data: {
    full_name: string;
    role: string;
    email?: string;
    avatar_url?: string;
    bio?: string;
  }) => Promise<void>;
}

export function TeamManager({
  team,
  onUpdate,
  onDelete,
  onCreate,
}: TeamManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");

  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newBio, setNewBio] = useState("");

  function openEdit(member: TeamMember) {
    setEditingId(member.id);
    setEditName(member.full_name);
    setEditRole(member.role);
    setEditEmail(member.email || "");
    setEditBio(member.bio || "");
    setEditAvatar(member.avatar_url || "");
  }

  async function saveEdit() {
    if (!editingId) return;
    await onUpdate(editingId, {
      full_name: editName,
      role: editRole,
      email: editEmail || null,
      bio: editBio || null,
      avatar_url: editAvatar || null,
    });
    setEditingId(null);
  }

  async function handleCreate() {
    if (!newName || !newRole) return;
    await onCreate({
      full_name: newName,
      role: newRole,
      email: newEmail || undefined,
      bio: newBio || undefined,
    });
    setNewName("");
    setNewRole("");
    setNewEmail("");
    setNewBio("");
    setNewOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {team.length} team member{team.length !== 1 ? "s" : ""}
        </p>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Full Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input placeholder="Role (e.g., CEO)" value={newRole} onChange={(e) => setNewRole(e.target.value)} />
              <Input placeholder="Email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              <Textarea placeholder="Bio" value={newBio} onChange={(e) => setNewBio(e.target.value)} />
              <Button onClick={handleCreate}>Add Member</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((member) => {
          const initials = member.full_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
          const isEditing = editingId === member.id;

          if (isEditing) {
            return (
              <div
                key={member.id}
                className="rounded-lg border border-border bg-card p-4 space-y-3"
              >
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Name"
                />
                <Input
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  placeholder="Role"
                />
                <Input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Email"
                />
                <Input
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="Avatar URL"
                />
                <Textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Bio"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdit}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={member.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
            >
              <Avatar className="h-10 w-10 shrink-0 rounded-full">
                {member.avatar_url ? (
                  <AvatarImage src={member.avatar_url} alt={member.full_name} />
                ) : null}
                <AvatarFallback className="rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground">
                  {member.full_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {member.role}
                </div>
                {member.email && (
                  <div className="text-xs text-muted-foreground/70">
                    {member.email}
                  </div>
                )}
                {member.bio && (
                  <div className="mt-1 text-xs text-muted-foreground/60 line-clamp-2">
                    {member.bio}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 flex-col gap-1">
                <button
                  onClick={() =>
                    onUpdate(member.id, { is_active: !member.is_active })
                  }
                  className={`text-[10px] ${
                    member.is_active
                      ? "text-green-600 dark:text-green-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {member.is_active ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => openEdit(member)}
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(member.id)}
                  className="text-[10px] text-destructive hover:text-destructive/80"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
