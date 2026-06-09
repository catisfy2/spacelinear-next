"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Check,
  Copy,
  Loader2,
  Mic,
  MicOff,
  MoreVertical,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  getActivityFromMetadata,
  parseSseChunk,
  type MochiActivity,
  type MochiFeedback,
  type MochiStreamEvent,
} from "@/lib/mochi/stream";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  activity: MochiActivity[];
  feedback: MochiFeedback | null;
}

const FRAMES = [
  "/assets/Mochi Mascot Spritesheet/1-idle-looking.png",
  "/assets/Mochi Mascot Spritesheet/2-idle-close-eye.png",
  "/assets/Mochi Mascot Spritesheet/3-idle-looking.png",
  "/assets/Mochi Mascot Spritesheet/4-idle-looking-left.png",
  "/assets/Mochi Mascot Spritesheet/5-idle-looking-right.png",
];

const GREETINGS = [
  "What are we studying today?",
  "Ready to learn something new?",
  "What should we tackle first?",
  "Time to study! What's on your mind?",
  "Hey! What are we learning today?",
  "Let's make progress! What's up?",
  "Another day, another topic to master!",
  "What's caught your attention today?",
  "Let's get started! What's first?",
  "Curious about something today?",
];

function useGreeting() {
  const [greeting, setGreeting] = useState("");
  useEffect(() => {
    const pick = () => {
      const now = new Date();
      const seed =
        now.getFullYear() * 365 +
        now.getMonth() * 31 +
        now.getDate() +
        now.getHours();
      setGreeting(GREETINGS[seed % GREETINGS.length]);
    };
    pick();
    const interval = setInterval(pick, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  return greeting;
}

function useMochiSprite() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const interval = setInterval(
      () => setFrame((current) => (current + 1) % FRAMES.length),
      3000,
    );
    return () => clearInterval(interval);
  }, []);
  return frame;
}

function MochiMascot({ frame }: { frame: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-[86px] w-[66px]"
    >
      <img
        src={FRAMES[frame]}
        alt="Mochi"
        className="size-full object-contain"
        draggable={false}
      />
    </motion.div>
  );
}

export function ActivitySummary({
  activity,
  streaming = false,
}: {
  activity: MochiActivity[];
  streaming?: boolean;
}) {
  if (!activity.length) return null;
  return (
    <div className="flex flex-col gap-[8px]" aria-label="Mochi activity">
      <p
        className={cn(
          "bg-gradient-to-r from-black via-[#666] to-black bg-clip-text text-[16px] font-medium text-transparent",
          streaming && "animate-pulse",
        )}
      >
        {streaming ? "Thinking..." : "Thought for a second."}
      </p>
      <div className="flex flex-col gap-1 px-[17px] text-[14px] font-medium text-[#28261b]/65">
        {activity.map((item, index) => (
          <div key={`${item.label}-${index}`} className="flex items-start gap-2">
            {item.status === "pending" ? (
              <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin" />
            ) : (
              <Check className="mt-0.5 size-3.5 shrink-0" />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeedbackActions({
  message,
  onFeedback,
}: {
  message: ChatMessage;
  onFeedback: (id: string, feedback: MochiFeedback | null) => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success("Response copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy response");
    }
  };

  const actionClass =
    "flex size-[25px] items-center justify-center rounded-md text-[#3d3929]/75 transition-colors hover:bg-[#e9e6dc] hover:text-[#3d3929] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cd7b53]/50";

  return (
    <div className="flex h-[25px] items-center gap-[13px]">
      <button
        type="button"
        onClick={() =>
          onFeedback(
            message.id,
            message.feedback === "positive" ? null : "positive",
          )
        }
        className={cn(
          actionClass,
          message.feedback === "positive" && "bg-[#e9e6dc] text-[#b05730]",
        )}
        aria-label="Helpful response"
        aria-pressed={message.feedback === "positive"}
      >
        <ThumbsUp className="size-[15px]" />
      </button>
      <button
        type="button"
        onClick={() =>
          onFeedback(
            message.id,
            message.feedback === "negative" ? null : "negative",
          )
        }
        className={cn(
          actionClass,
          message.feedback === "negative" && "bg-[#e9e6dc] text-[#b05730]",
        )}
        aria-label="Not helpful response"
        aria-pressed={message.feedback === "negative"}
      >
        <ThumbsDown className="size-[15px]" />
      </button>
      <button type="button" onClick={copy} className={actionClass} aria-label="Copy response">
        {copied ? <Check className="size-[15px]" /> : <Copy className="size-[15px]" />}
      </button>
    </div>
  );
}

function AssistantResponse({
  message,
  streaming,
  onFeedback,
}: {
  message: ChatMessage;
  streaming?: boolean;
  onFeedback: (id: string, feedback: MochiFeedback | null) => Promise<void>;
}) {
  return (
    <div className="flex w-full flex-col gap-[10px] pl-[10px] pr-0 md:pr-[160px]">
      <ActivitySummary activity={message.activity} streaming={streaming} />
      {message.content && (
        <div className="mochi-markdown break-words text-[14px] font-medium leading-normal text-[#28261b]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
      )}
      {!streaming && message.content && (
        <FeedbackActions message={message} onFeedback={onFeedback} />
      )}
    </div>
  );
}

function ConversationTitle({
  title,
  onRename,
  onDelete,
}: {
  title: string;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="absolute left-1/2 top-[19px] z-20 flex max-w-[calc(100%-88px)] -translate-x-1/2 items-center gap-[10px] rounded-[17px] bg-[rgba(233,230,220,0.29)] px-[23px] py-[3px] backdrop-blur-[4.55px]">
      <span className="truncate text-[16px] font-medium text-black md:text-[18px]">
        {title}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex size-[28px] shrink-0 items-center justify-center rounded-full hover:bg-[#e9e6dc]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cd7b53]/50"
            aria-label="Conversation options"
          >
            <MoreVertical className="size-[16px]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onRename}>Rename</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={onDelete}
            className="text-destructive focus:text-destructive"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function MochiComposer({
  input,
  setInput,
  file,
  disabled,
  fileInputRef,
  onSend,
}: {
  input: string;
  setInput: (value: string) => void;
  file: File | null;
  disabled: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSend: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputBeforeSpeech = useRef("");
  const {
    isSupported,
    isListening,
    isProcessing,
    error,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText();

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "24px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [input]);

  useEffect(() => {
    if (!transcript) return;
    setInput(
      inputBeforeSpeech.current
        ? `${inputBeforeSpeech.current.replace(/\s*$/, "")} ${transcript}`
        : transcript,
    );
  }, [setInput, transcript]);

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      inputBeforeSpeech.current = input;
      resetTranscript();
      startListening();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex min-h-[97px] w-full flex-col justify-center gap-[14px] overflow-hidden rounded-[22px] border-2 border-[rgba(204,121,81,0.32)] bg-white px-4 pb-2.5 pt-5 transition-shadow focus-within:ring-2 focus-within:ring-[rgba(204,121,81,0.2)] hover:shadow-[0_4px_11.4px_rgba(205,123,82,0.38)] dark:bg-card">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write anything"
          rows={1}
          disabled={disabled}
          className="min-h-[24px] max-h-[120px] w-full resize-none bg-transparent text-[16px] font-medium text-[#3d3929] outline-none placeholder:text-[#3d3929]/70 dark:text-foreground dark:placeholder:text-foreground/60"
        />
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className={cn(
              "flex size-[24px] items-center justify-center transition-opacity disabled:cursor-not-allowed disabled:opacity-40",
              file ? "opacity-100" : "opacity-80 hover:opacity-100",
            )}
            aria-label="Attach file"
          >
            <img src="/assets/mochi-plus.svg" alt="" className="size-full" />
          </button>
          <div className="flex h-[34px] items-center gap-[6px]">
            {isSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                disabled={disabled}
                className={cn(
                  "flex size-[28px] items-center justify-center rounded-lg text-[#666356] transition-colors hover:bg-[#e9e6dc] disabled:opacity-40",
                  isListening && "bg-destructive text-destructive-foreground",
                  isProcessing && !isListening && "animate-pulse",
                )}
                aria-label={isListening ? "Stop voice input" : "Start voice input"}
              >
                {isListening ? <MicOff className="size-[17px]" /> : <Mic className="size-[17px]" />}
              </button>
            )}
            <button
              type="button"
              onClick={onSend}
              disabled={!input.trim() || disabled}
              className="flex size-[34px] items-center justify-center rounded-[10px] bg-[#cd7b53] text-white transition-colors hover:bg-[#b96943] disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Send message"
            >
              {disabled ? <Loader2 className="size-[17px] animate-spin" /> : <ArrowUp className="size-[18px]" />}
            </button>
          </div>
        </div>
      </div>
      {error && !isListening && (
        <p className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function MochiChat() {
  const { user } = useAuth();
  const router = useRouter();
  const conversationParam = useSearchParams().get("conversation");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamMessage, setStreamMessage] = useState<ChatMessage | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(conversationParam);
  const [conversationTitle, setConversationTitle] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialLoadDone = useRef(false);
  const greeting = useGreeting();
  const spriteFrame = useMochiSprite();
  const hasMessages = messages.length > 0 || Boolean(streamMessage);
  const isInitial = !hasMessages && !activeChatId;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAccessToken(data.session?.access_token ?? "");
    });
  }, []);

  useEffect(() => {
    if (hasMessages || isStreaming) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [hasMessages, isStreaming, messages, streamMessage]);

  useEffect(() => {
    if (conversationParam !== activeChatId) {
      if (!conversationParam && isStreaming) return;
      setActiveChatId(conversationParam);
      setMessages([]);
      setConversationTitle("");
      initialLoadDone.current = false;
    }
  }, [activeChatId, conversationParam, isStreaming]);

  const fetchConversation = useCallback(
    async (chatId: string) => {
      if (!user) return;
      setLoading(true);
      const [{ data: rows }, { data: chat }] = await Promise.all([
        supabase
          .from("mochi_conversations")
          .select("*")
          .eq("mochi_chat_id", chatId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
        supabase.from("mochi_chats").select("title").eq("id", chatId).single(),
      ]);
      setMessages(
        (rows ?? [])
          .filter((row) => row.role === "user" || row.role === "assistant")
          .map((row) => ({
            id: row.id,
            role: row.role as "user" | "assistant",
            content: row.content ?? "",
            activity: getActivityFromMetadata(row.tool_calls),
            feedback:
              row.feedback === "positive" || row.feedback === "negative"
                ? row.feedback
                : null,
          })),
      );
      setConversationTitle(chat?.title ?? "");
      initialLoadDone.current = true;
      setLoading(false);
    },
    [user],
  );

  useEffect(() => {
    if (activeChatId && user && !initialLoadDone.current && !isStreaming) {
      fetchConversation(activeChatId);
    }
  }, [activeChatId, fetchConversation, user, isStreaming]);

  const handleFeedback = async (
    messageId: string,
    feedback: MochiFeedback | null,
  ) => {
    if (!user) return;
    const previous = messages.find((message) => message.id === messageId)?.feedback ?? null;
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId ? { ...message, feedback } : message,
      ),
    );
    const { error } = await supabase
      .from("mochi_conversations")
      .update({
        feedback,
        feedback_updated_at: feedback ? new Date().toISOString() : null,
      })
      .eq("id", messageId)
      .eq("user_id", user.id)
      .eq("role", "assistant");
    if (error) {
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId ? { ...message, feedback: previous } : message,
        ),
      );
      toast.error("Could not save feedback");
    }
  };

  const handleStreamEvent = useCallback(
    (event: MochiStreamEvent, submittedFile: File | null) => {
      if (event.type === "meta") {
        if (event.chatId !== activeChatId) {
          setActiveChatId(event.chatId);
          router.replace(`/mochi?conversation=${event.chatId}`, { scroll: false });
          initialLoadDone.current = true;
        }
        if (event.filePageCount && submittedFile) {
          setMessages((current) =>
            current.map((message, index) =>
              index === current.length - 1 && message.role === "user"
                ? {
                    ...message,
                    content: `File: ${submittedFile.name} - ${event.filePageCount} pages\n\n${message.content.split("\n\n").at(-1)}`,
                  }
                : message,
            ),
          );
        }
        setStreamMessage((current) => ({
          id: current?.id ?? "streaming-assistant",
          role: "assistant",
          content: current?.content ?? "",
          activity: event.activity,
          feedback: null,
        }));
      } else if (event.type === "text") {
        setStreamMessage((current) => ({
          id: current?.id ?? "streaming-assistant",
          role: "assistant",
          content: `${current?.content ?? ""}${event.delta}`,
          activity: current?.activity ?? [],
          feedback: null,
        }));
      } else if (event.type === "title") {
        setConversationTitle(event.title);
      } else if (event.type === "done") {
        setStreamMessage((current) =>
          current ? { ...current, id: event.messageId } : current,
        );
      } else if (event.type === "error") {
        toast.error(event.message);
      }
    },
    [activeChatId, router],
  );

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || !user || !accessToken || isStreaming) return;
    const submittedFile = file;
    const submittedInput = input;
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: submittedFile ? `File: ${submittedFile.name}\n\n${content}` : content,
      activity: [],
      feedback: null,
    };
    const history = [...messages, userMessage]
      .slice(-20)
      .map(({ role, content: messageContent }) => ({ role, content: messageContent }));

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setFile(null);
    setStreamMessage({
      id: "streaming-assistant",
      role: "assistant",
      content: "",
      activity: [{ label: "Analyzing your question", status: "pending" }],
      feedback: null,
    });
    setIsStreaming(true);

    try {
      const body = new FormData();
      body.append("prompt", content);
      body.append("accessToken", accessToken);
      body.append("mochiChatId", activeChatId ?? "");
      body.append("history", JSON.stringify(history));
      if (submittedFile) body.append("file", submittedFile);
      const response = await fetch("/api/mochi/chat", { method: "POST", body });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response stream unavailable");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parsed = parseSseChunk(buffer);
        buffer = parsed.remainder;
        parsed.events.forEach((event) => handleStreamEvent(event, submittedFile));
      }
      const parsed = parseSseChunk(`${buffer}\n\n`);
      parsed.events.forEach((event) => handleStreamEvent(event, submittedFile));
      setStreamMessage((current) => {
        if (current?.content) {
          setMessages((existing) => {
            const map = new Map(existing.map((m) => [m.id, m]));
            map.set(current.id, current);
            return Array.from(map.values());
          });
        }
        return null;
      });
    } catch (error) {
      console.error("Mochi chat error:", error);
      setInput((current) => current || submittedInput);
      setFile((current) => current ?? submittedFile);
      setStreamMessage(null);
      toast.error(error instanceof Error ? error.message : "Mochi could not respond");
    } finally {
      setIsStreaming(false);
    }
  }, [
    accessToken,
    activeChatId,
    file,
    handleStreamEvent,
    input,
    isStreaming,
    messages,
    user,
  ]);

  const renameConversation = async () => {
    if (!activeChatId || !user) return;
    const title = window.prompt("Rename conversation", conversationTitle)?.trim();
    if (!title || title === conversationTitle) return;
    const { error } = await supabase
      .from("mochi_chats")
      .update({ title })
      .eq("id", activeChatId)
      .eq("user_id", user.id);
    if (error) return toast.error("Could not rename conversation");
    setConversationTitle(title);
    toast.success("Conversation renamed");
  };

  const deleteConversation = async () => {
    if (!activeChatId || !user) return;
    if (!window.confirm(`Delete "${conversationTitle}"?`)) return;
    const { error } = await supabase
      .from("mochi_chats")
      .delete()
      .eq("id", activeChatId)
      .eq("user_id", user.id);
    if (error) return toast.error("Could not delete conversation");
    router.push("/mochi");
    toast.success("Conversation deleted");
  };

  const composer = (
    <MochiComposer
      input={input}
      setInput={setInput}
      file={file}
      disabled={isStreaming}
      fileInputRef={fileInputRef}
      onSend={handleSend}
    />
  );

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#faf9f5] dark:bg-background">
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept=".pdf,.docx,.txt,.md,.csv,.html,.htm"
        onChange={(event) => {
          setFile(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />

      {file && (
        <div className="absolute left-1/2 top-3 z-30 flex max-w-[calc(100%-96px)] -translate-x-1/2 items-center gap-2 rounded-full border border-[rgba(204,121,81,0.32)] bg-white px-4 py-2 text-sm shadow-sm">
          <span className="truncate text-[#3d3929]/80">{file.name}</span>
          <button type="button" onClick={() => setFile(null)} disabled={isStreaming} aria-label="Remove attachment">
            ×
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {isInitial ? (
          <motion.div
            key="initial"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -40 }}
            className="flex flex-1 items-center justify-center px-4"
          >
            <div className="flex w-full max-w-[621px] flex-col items-center gap-[21px]">
              <h1 className="text-center text-[26px] font-medium text-[#b05730] md:text-[32px]">
                {greeting}
              </h1>
              <div className="flex w-full flex-col items-end">
                <div className="flex h-[86px] w-full items-center justify-end px-8 md:px-[48px]">
                  <MochiMascot frame={spriteFrame} />
                </div>
                {composer}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="conversation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative flex min-h-0 flex-1 flex-col"
          >
            {conversationTitle && (
              <ConversationTitle
                title={conversationTitle}
                onRename={renameConversation}
                onDelete={deleteConversation}
              />
            )}
            {loading ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-[#b05730]" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-4 pt-[83px]">
                <div className="mx-auto flex w-full max-w-[674px] flex-col gap-[24px] pb-[245px]">
                  {messages.map((message) => (
                    <div key={message.id}>
                      {message.role === "user" ? (
                        <div className="ml-auto w-fit max-w-[300px] whitespace-pre-wrap break-words rounded-[12px] bg-[#e9e6dc] p-[16px] text-[14px] font-medium leading-normal text-[#28261b]">
                          {message.content}
                        </div>
                      ) : (
                        <AssistantResponse message={message} onFeedback={handleFeedback} />
                      )}
                    </div>
                  ))}
                  {streamMessage && (
                    <AssistantResponse
                      message={streamMessage}
                      streaming
                      onFeedback={handleFeedback}
                    />
                  )}
                  {!hasMessages && activeChatId && (
                    <p className="text-center text-[16px] font-medium text-[#3d3929]/50">
                      Start a conversation below
                    </p>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
            <div className="absolute bottom-[max(24px,env(safe-area-inset-bottom))] left-1/2 z-10 flex w-[calc(100%-32px)] max-w-[621px] -translate-x-1/2 flex-col items-end">
              <div className="flex h-[86px] w-full items-center justify-end px-8 md:px-[48px]">
                <MochiMascot frame={spriteFrame} />
              </div>
              {composer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
