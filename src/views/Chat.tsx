"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import { supabase } from "@/integrations/supabase/client";
import type { Conversation, Message } from "@/lib/types";
import { PageShell } from "@/components/app/PageShell";
import { toast } from "sonner";
import { SuggestionCards } from "@/components/chat/SuggestionCards";
import { ChatInput } from "@/components/chat/ChatInput";
import { NewSubjectDialog } from "@/components/chat/NewSubjectDialog";
import { NewTopicDialog } from "@/components/chat/NewTopicDialog";
import { NewNoteDialog } from "@/components/chat/NewNoteDialog";
import { NewQuizDialog } from "@/components/chat/NewQuizDialog";
import { StudyModeDialog } from "@/components/chat/StudyModeDialog";
import { StudyPlanDialog } from "@/components/chat/StudyPlanDialog";
import { StudyModeOverlay } from "@/components/study-mode";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { useChatStore } from "@/hooks/useChatStore";

export function ChatPage() {
  const { user } = useAuth();
  const { topics, subjects, uploadFile } = useStore();
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
  const [showNewSubjectDialog, setShowNewSubjectDialog] = useState(false);
  const [showNewTopicDialog, setShowNewTopicDialog] = useState(false);
  const [showNewNoteDialog, setShowNewNoteDialog] = useState(false);
  const [showNewQuizDialog, setShowNewQuizDialog] = useState(false);
  const [showStudyModeDialog, setShowStudyModeDialog] = useState(false);
  const [showStudyPlanDialog, setShowStudyPlanDialog] = useState(false);
  const [studyModeMinutes, setStudyModeMinutes] = useState<number | null>(null);

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

  const handleAttach = useCallback(
    async (file: File) => {
      if (!user) return;
      try {
        // Upload as a study material — this also triggers quiz generation
        const material = await uploadFile(file, null, user.id);
        toast.success(`Uploaded "${file.name}"`);

        // Send a message to the AI agent to create a quiz set from the material
        const message = `I've uploaded a study material called "${material.name}". Please analyze it and create a quiz set with 10 questions based on its content to help me study.`;
        handleSend(message);
      } catch (err) {
        console.error("Upload failed:", err);
        toast.error("Failed to upload file");
      }
    },
    [user, uploadFile, handleSend],
  );

  // Prefill message from ?q= query param
  const qParam = searchParams.get("q");
  const qSent = useRef(false);
  useEffect(() => {
    if (qParam && user && !activeConversationId && !qSent.current) {
      qSent.current = true;
      handleSend(qParam);
    }
  }, [qParam, user, activeConversationId, handleSend]);

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

  // Called after the study mode dialog — starts the focus session
  const handleStudyModeStart = useCallback((minutes: number) => {
    setStudyModeMinutes(minutes);
  }, []);

  // Called after the study plan dialog — sends AI prompt with actual user data
  const handleStudyPlanCreate = useCallback(
    (scope: "today" | "upcoming", saveToNotes: boolean) => {
      const scopeLabel =
        scope === "today"
          ? "for today only"
          : "for today and the upcoming days";

      // Build a compact list of the user's actual subjects and topics
      const subjectList = subjects
        .map((s) => {
          const topicTitles = topics
            .filter((t) => t.subjectId === s.id)
            .map((t) => t.title);
          const topicStr =
            topicTitles.length > 0
              ? ` — topics: ${topicTitles.join(", ")}`
              : " — no topics yet";
          return `- ${s.name}${topicStr}`;
        })
        .join("\n");

      const studyDataContext =
        subjects.length > 0
          ? `\n\nHere are my actual subjects and topics that the plan should be based on:\n${subjectList}\n\n`
          : "\n\nI don't have any subjects or topics set up yet. Please just give me general advice on how to structure my study time effectively based on best practices.\n\n";

      const notesInstruction = saveToNotes
        ? " After generating the plan, also save it as a note in my notes section with the title 'Study Plan - <date>' so I can reference it later."
        : "";

      const message = `I need a personalized study plan ${scopeLabel}.${studyDataContext}

IMPORTANT RULES:
- ONLY reference subjects and topics from the list above. Do NOT create, suggest, or invent any new subjects or topics.
- If I don't have many subjects or topics yet, give me general study advice instead.
- For each study session, suggest a specific focus area, how long to spend, and what learning activity to do (review notes, practice questions, active recall, etc.).
- Format the plan with clear sections, time blocks, and actionable bullet points.
- Be realistic — don't pack more than what can be reasonably accomplished.${notesInstruction}`;

      handleSend(message);
    },
    [handleSend, subjects, topics],
  );

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasMessages = messages.length > 0;

  // Called after the subject dialog — triggers AI quiz generation
  const handleSubjectCreated = useCallback(
    (subjectName: string, topicTitles: string[]) => {
      const topicsPart =
        topicTitles.length > 0 ? ` with topics: ${topicTitles.join(", ")}` : "";
      const message = `I just created a new subject called "${subjectName}"${topicsPart}. Please create a comprehensive 10-question quiz set covering the fundamentals of ${subjectName} to help me study.`;
      handleSend(message);
    },
    [handleSend],
  );

  // Called after the topic dialog — triggers AI quiz generation
  const handleTopicCreated = useCallback(
    (topicTitle: string, subjectName: string) => {
      const message = `I just created a new topic called "${topicTitle}" under "${subjectName}". Please create a comprehensive 10-question quiz set covering "${topicTitle}" to help me study this topic.`;
      handleSend(message);
    },
    [handleSend],
  );

  // Called after the note dialog — triggers AI note generation
  const handleNoteCreated = useCallback(
    (noteTitle: string, contentType: string, customPrompt?: string) => {
      const typeGuide =
        contentType === "summary"
          ? "a concise summary"
          : contentType === "study_guide"
            ? "a structured study guide"
            : contentType === "cheat_sheet"
              ? "a cheat sheet"
              : contentType === "explanation"
                ? "a detailed explanation"
                : contentType === "flashcards"
                  ? "flashcards (question-answer pairs)"
                  : "content";
      const customPart = customPrompt
        ? ` Follow these instructions: ${customPrompt}`
        : "";
      const message = `I just created a new note called "${noteTitle}". Please generate ${typeGuide} for "${noteTitle}" and save it as the note content.${customPart}`;
      handleSend(message);
    },
    [handleSend],
  );

  // Called after the quiz dialog — triggers AI quiz generation
  const handleQuizCreated = useCallback(
    (context: {
      subjectName?: string;
      topicName?: string;
      noteNames: string[];
      instructions?: string;
    }) => {
      const parts: string[] = [];
      if (context.subjectName) parts.push(`subject "${context.subjectName}"`);
      if (context.topicName) parts.push(`topic "${context.topicName}"`);
      const scope = parts.length > 0 ? ` on ${parts.join(" and ")}` : "";

      const notesPart =
        context.noteNames.length > 0
          ? ` Use these notes as reference: ${context.noteNames.join(", ")}.`
          : "";
      const instructionPart = context.instructions
        ? ` ${context.instructions}`
        : "";

      const message = `Please create a quiz set${scope} with multiple-choice questions.${notesPart}${instructionPart} Create the quiz set using the createQuizSet action.`;
      handleSend(message);
    },
    [handleSend],
  );

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
              onShowStudyPlanDialog={() => setShowStudyPlanDialog(true)}
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
            onAttach={handleAttach}
            onShowNewSubjectDialog={() => setShowNewSubjectDialog(true)}
            onShowNewTopicDialog={() => setShowNewTopicDialog(true)}
            onShowNewNoteDialog={() => setShowNewNoteDialog(true)}
            onShowNewQuizDialog={() => setShowNewQuizDialog(true)}
            onShowStudyModeDialog={() => setShowStudyModeDialog(true)}
            onShowStudyPlanDialog={() => setShowStudyPlanDialog(true)}
            isStreaming={isStreaming}
          />
        </PageShell>
      </div>

      {/* New Subject Dialog */}
      <NewSubjectDialog
        open={showNewSubjectDialog}
        onOpenChange={setShowNewSubjectDialog}
        onCreated={handleSubjectCreated}
      />

      {/* New Topic Dialog */}
      <NewTopicDialog
        open={showNewTopicDialog}
        onOpenChange={setShowNewTopicDialog}
        onCreated={handleTopicCreated}
      />

      {/* New Note Dialog */}
      <NewNoteDialog
        open={showNewNoteDialog}
        onOpenChange={setShowNewNoteDialog}
        onCreated={handleNoteCreated}
      />

      {/* New Quiz Dialog */}
      <NewQuizDialog
        open={showNewQuizDialog}
        onOpenChange={setShowNewQuizDialog}
        onCreated={handleQuizCreated}
      />

      {/* Study Mode Dialog */}
      <StudyModeDialog
        open={showStudyModeDialog}
        onOpenChange={setShowStudyModeDialog}
        onStart={handleStudyModeStart}
      />

      {/* Study Plan Dialog */}
      <StudyPlanDialog
        open={showStudyPlanDialog}
        onOpenChange={setShowStudyPlanDialog}
        onCreate={handleStudyPlanCreate}
      />

      {/* Study Mode Overlay */}
      {studyModeMinutes != null && (
        <StudyModeOverlay
          minutes={studyModeMinutes}
          onClose={() => setStudyModeMinutes(null)}
        />
      )}
    </div>
  );
}
