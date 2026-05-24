"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import { supabase } from "@/integrations/supabase/client";
import type { Conversation, Message } from "@/lib/types";
import { PageShell } from "@/components/app/PageShell";
import { SuggestionCards } from "@/components/chat/SuggestionCards";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { useChatStore } from "@/hooks/useChatStore";

export function ChatPage() {
  const { user } = useAuth();
  const { topics, subjects } = useStore();
  const searchParams = useSearchParams();
  const conversationParam = searchParams.get("conversation");

  const {
    conversations,
    activeConversationId,
    messages,
    loading,
    setConversations,
    setActiveConversationId,
    setMessages,
    addMessage,
    setLoading,
  } = useChatStore();

  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Fetch conversations on mount
  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversation from query param once conversations are loaded
  useEffect(() => {
    if (
      !conversationParam ||
      initialLoadDone ||
      (conversations.length === 0 && !loading)
    )
      return;
    if (conversations.length === 0 && loading) return;

    const targetConv = conversations.find((c) => c.id === conversationParam);
    if (targetConv) {
      setActiveConversationId(conversationParam);
    } else {
      // Maybe it's a fresh conversation ID from the URL
      setActiveConversationId(conversationParam);
    }
    setInitialLoadDone(true);
  }, [conversationParam, conversations, loading, initialLoadDone]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) return;
    fetchMessages(activeConversationId);
  }, [activeConversationId]);

  // If query param changes (user navigates from history), reload
  useEffect(() => {
    if (conversationParam && conversationParam !== activeConversationId) {
      setInitialLoadDone(false);
    }
  }, [conversationParam]);

  const fetchConversations = async () => {
    if (!user) return;
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
  };

  const fetchMessages = async (conversationId: string) => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    setMessages(
      (data ?? []).map((r) => ({
        id: r.id,
        conversationId: r.conversation_id,
        role: r.role as "user" | "assistant",
        content: r.content,
        createdAt: r.created_at,
      })),
    );
    setLoading(false);
  };

  const createConversation = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title: "New Chat" })
      .select()
      .single();
    if (error || !data) return;
    const conv: Conversation = {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    // Update URL without navigation
    window.history.replaceState(null, "", `/chat?conversation=${conv.id}`);
    setConversations([conv, ...conversations]);
    setActiveConversationId(conv.id);
    setMessages([]);
  };

  const handleSend = useCallback(
    async (content: string) => {
      if (!user || !content.trim() || isStreaming) return;

      let convId = activeConversationId;
      // Create conversation if none active
      if (!convId) {
        const { data, error } = await supabase
          .from("conversations")
          .insert({ user_id: user.id, title: content.slice(0, 60) })
          .select()
          .single();
        if (error || !data) return;
        convId = data.id;
        const conv: Conversation = {
          id: data.id,
          userId: data.user_id,
          title: data.title,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        window.history.replaceState(null, "", `/chat?conversation=${conv.id}`);
        setConversations([conv, ...conversations]);
        setActiveConversationId(conv.id);
      }

      // Add user message locally
      const tempUserMsg: Message = {
        id: `temp-${Date.now()}`,
        conversationId: convId,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      addMessage(tempUserMsg);
      setIsStreaming(true);

      // Build message history for API
      const historyMessages = [...messages, tempUserMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: convId,
            messages: historyMessages,
            accessToken,
          }),
        });

        if (!response.ok) throw new Error("Failed to send message");

        // Read the stream
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let fullContent = "";

        // Create a placeholder assistant message
        const tempAssistantMsg: Message = {
          id: `temp-assistant-${Date.now()}`,
          conversationId: convId,
          role: "assistant",
          content: "",
          createdAt: new Date().toISOString(),
        };
        addMessage(tempAssistantMsg);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;

          // Update the message in place
          useChatStore.setState((state) => ({
            messages: state.messages.map((m) =>
              m.id === tempAssistantMsg.id ? { ...m, content: fullContent } : m,
            ),
          }));
        }

        // Refresh conversations list to get updated title
        await fetchConversations();
        // Reload messages from DB to get proper IDs
        await fetchMessages(convId!);
      } catch (err) {
        console.error("Chat error:", err);
        // Add error message
        const errorMsg: Message = {
          id: `error-${Date.now()}`,
          conversationId: convId,
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          createdAt: new Date().toISOString(),
        };
        addMessage(errorMsg);
      } finally {
        setIsStreaming(false);
      }
    },
    [user, activeConversationId, conversations, messages, isStreaming],
  );

  const handleSuggestionClick = useCallback(
    async (suggestion: string) => {
      if (inputRef.current) {
        inputRef.current.value = suggestion;
        inputRef.current.focus();
        handleSend(suggestion);
      }
    },
    [handleSend],
  );

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto">
        <PageShell
          maxWidth="narrow"
          padded={false}
          className="flex min-h-full flex-col pt-4"
        >
          {loading && activeConversationId && (
            <div className="flex items-center justify-center py-16">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {!loading && hasMessages && (
            <div className="flex-1 space-y-4 pb-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </div>
          )}

          {!loading && !hasMessages && activeConversationId && (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              Start a conversation below
            </div>
          )}

          {/* Suggestion cards — only show when no messages and no active conversation */}
          {!hasMessages && !activeConversationId && (
            <SuggestionCards
              topics={topics}
              subjects={subjects}
              onSelect={handleSuggestionClick}
            />
          )}

          <div ref={messagesEndRef} />
        </PageShell>
      </div>

      {/* ── Input area ── */}
      <div className="border-t border-border">
        <PageShell maxWidth="narrow" padded={false} className="py-3">
          <ChatInput
            ref={inputRef}
            onSend={handleSend}
            isStreaming={isStreaming}
          />
        </PageShell>
      </div>
    </div>
  );
}
