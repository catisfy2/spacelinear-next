"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Conversation } from "@/lib/types";
import { PageShell } from "@/components/app/PageShell";
import { PageHeader } from "@/components/app/PageHeader";
import { MessageSquare, Trash2, ArrowLeft, Search } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

export function ChatHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchAllConversations();
  }, [user]);

  const fetchAllConversations = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    setConversations(
      (data ?? []).map((r) => ({
        id: r.id,
        userId: r.user_id,
        title: r.title,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    );
    setLoading(false);
  };

  const deleteConversation = async (id: string) => {
    await supabase.from("conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
  };

  const filtered = search
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase()),
      )
    : conversations;

  return (
    <PageShell maxWidth="narrow">
      <PageHeader
        title="Chat History"
        actions={
          <button
            type="button"
            onClick={() => router.push("/chat")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </button>
        }
      />

      {/* ── Search ── */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations..."
          className="pl-9"
        />
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {search
              ? "No conversations match your search"
              : "No conversations yet"}
          </p>
          {!search && (
            <button
              type="button"
              onClick={() => router.push("/chat")}
              className="mt-3 text-sm text-primary transition-colors hover:text-primary/80"
            >
              Start a new chat →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((conv) => (
            <button
              key={conv.id}
              type="button"
              onClick={() => router.push(`/chat?conversation=${conv.id}`)}
              className="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {conv.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {format(new Date(conv.updatedAt), "MMM d, yyyy · h:mm a")}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="hidden shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive group-hover:block"
                aria-label="Delete conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </button>
          ))}
        </div>
      )}
    </PageShell>
  );
}
