# SpaceLinear AI Architecture

> **AI Agent Instruction:** Whenever you modify any AI-related architecture (adding/removing/changing agents, tools, API routes, providers, prompts, embeddings, vector stores, background jobs, or AI components), you MUST update this document to reflect the changes in real time before completing your task.

---

## 1. Overview

SpaceLinear uses **Groq** (`llama-3.3-70b-versatile`) via the **Vercel AI SDK** for all LLM inference. Three distinct AI agents serve different purposes, all using a custom `[ACTION]...[/ACTION]` tool-calling pattern. Background AI tasks run via **Inngest**. Vector search is handled through **Pinecone** (study content) and local **Xenova Transformers** embeddings (agent memories).

---

## 2. LLM Provider

| Property | Value |
|----------|-------|
| Provider | Groq (`@ai-sdk/groq`) |
| Model | `llama-3.3-70b-versatile` |
| Env key | `GROQ_API_KEY` |
| Audio model | `whisper-large-v3-turbo` (speech-to-text) |

All LLM calls use:
```typescript
import { groq } from "@ai-sdk/groq";
model: groq("llama-3.3-70b-versatile")
```

---

## 3. AI Agents

### 3.1 SpaceLinear Assistant

| Aspect | Detail |
|--------|--------|
| Route | `POST /api/chat` (`src/app/api/chat/route.ts`) |
| System prompt | Hardcoded in route file (lines 26-70) |
| Pattern | `streamText` → parse `[ACTION]...[/ACTION]` blocks → execute → append results to stream |
| Tools defined | `src/lib/agent-tools.ts` |

**Available Actions** (in `src/lib/agent-tools.ts`):
- `createSubject` — Creates a subject in Supabase
- `createTopic` — Creates a topic under a subject
- `createNote` — Creates a note for a topic
- `createMaterial` — Creates a material record
- `createQuizQuestions` — Creates quiz questions for a set
- `createQuizSet` — Creates a quiz question set

**Flow:**
```
User Message → API Route → system prompt + user msg → Groq LLM → streamed response with [ACTION] blocks
                                                                   → parseActionBlocks() extracts JSON
                                                                   → createActionExecutor() executes each
                                                                   → results appended back to stream
```

### 3.2 Mochi Study Companion

| Aspect | Detail |
|--------|--------|
| Route | `POST /api/mochi/chat` (`src/app/api/mochi/chat/route.ts`) |
| Prompts | `src/lib/mochi/prompts.ts` (general + study prompts, parameterized by tone) |
| Memory | `src/lib/mochi/embeddings.ts` (Xenova all-MiniLM-L6-v2, 384-dim) |
| Tools | `src/lib/mochi/tools.ts` (10 tools) |
| Types | `src/lib/mochi/types.ts` |
| File parser | `src/lib/mochi/fileParser.ts` |

**Available Tools** (defined inline in route file, lines 13-62):
1. `logStudyCommit` — Log a study session
2. `getStudyHistory` — Get recent study commits
3. `getWeeklyProgress` — Weekly quiz stats
4. `getQuizGaps` — Lowest accuracy topics
5. `recommendNextStudy` — Personalized recommendations
6. `getTodaysTopics` — Today's review list
7. `getGapBasedStudyList` — Prioritized review list
8. `searchMemory` — Semantic search over past memories
9. `storeMemory` — Store important facts as embeddings
10. `getDailyDigest` — Today's stats including streak
11. `importPastQuizData` — Import quiz history into memory

**Flow:**
```
User Message → API Route → tool descriptions injected into prompt + memories context → Groq generateText (decides actions)
→ parse [ACTION] blocks → execute tools (DB queries, memory search, etc.) → Groq streamText (synthesizes response with tool results)
```

**Proactive Alerts** (`src/app/api/mochi/alerts/route.ts`):
- Event-driven notifications stored in `agent_events` table
- Fetched by `MochiProvider` component on the frontend
- Triggers reminder bubbles for overdue study items

**Settings** (`mochi_settings` table):
- `enabled` (boolean) — Toggle Mochi on/off
- `tone` (enum: friendly/professional) — Personality
- `maxCrons` (number) — Max scheduled reminders per day
- Cron jobs stored in `mochi_crons` table

### 3.3 Study Mode Buddy

| Aspect | Detail |
|--------|--------|
| Route | `POST /api/chat/study-mode` (`src/app/api/chat/study-mode/route.ts`) |
| Purpose | Lightweight, session-specific help during focused study |
| System prompt | Hardcoded (lines 16-26) |
| Pattern | Simple `streamText` — no tool calling |

---

## 4. Tool Calling Pattern

The codebase uses a **custom action block pattern** rather than Vercel AI SDK's built-in `tools` parameter:

```typescript
// AI returns blocks like:
[ACTION]{"action":"toolName","params":{...}}[/ACTION]
```

**Parsing** (`src/lib/agent-tools.ts`):
- `parseActionBlocks(text: string): ActionBlock[]` — regex extracts JSON from `[ACTION]...[/ACTION]`
- `stripActionBlocks(text: string): string` — removes all action blocks for clean response text
- `createActionExecutor(accessToken: string): Executor` — creates authenticated executor with Supabase client

**Execution** (Mochi in `src/app/api/mochi/chat/route.ts`):
- `executeActions()` dynamically calls functions from `src/lib/mochi/tools.ts` by action name
- Two-phase: first `generateText` decides actions, then `streamText` synthesizes results

---

## 5. API Routes

| Method | Route | File | Purpose |
|--------|-------|------|---------|
| POST | `/api/chat` | `src/app/api/chat/route.ts` | Main AI chat + tool execution |
| POST | `/api/chat/study-mode` | `src/app/api/chat/study-mode/route.ts` | Study session chat |
| POST | `/api/mochi/chat` | `src/app/api/mochi/chat/route.ts` | Mochi agent with tools + memories |
| GET | `/api/mochi/alerts` | `src/app/api/mochi/alerts/route.ts` | Fetch pending agent events |
| POST | `/api/speech-to-text` | `src/app/api/speech-to-text/route.ts` | Groq Whisper transcription |
| POST | `/api/agent/plan` | `src/app/api/agent/plan/route.ts` | Create study plan (triggers Inngest) |
| GET | `/api/agent/plan` | `src/app/api/agent/plan/route.ts` | Fetch study plan status |
| POST | `/api/agent/plan/[id]/apply` | `src/app/api/agent/plan/[id]/apply/route.ts` | Apply plan (create entities) |
| POST | `/api/quiz/generate` | `src/app/api/quiz/generate/route.ts` | Start quiz generation (Inngest) |
| GET | `/api/quiz/generate/[id]/status` | `src/app/api/quiz/generate/[questionSetId]/status/route.ts` | Poll generation |
| POST | `/api/quiz/sessions` | `src/app/api/quiz/sessions/route.ts` | List quiz sessions |
| POST | `/api/quiz/sessions/[id]/complete` | `src/app/api/quiz/sessions/[id]/complete/route.ts` | Complete + AI short-answer eval |
| GET | `/api/quiz/reports/daily` | `src/app/api/quiz/reports/daily/route.ts` | Daily quiz report |
| GET | `/api/quiz/reports/weekly` | `src/app/api/quiz/reports/weekly/route.ts` | Weekly quiz report |
| GET | `/api/quiz/reports/gaps` | `src/app/api/quiz/reports/gaps/route.ts` | Topic gap analysis |

---

## 6. Background Jobs (Inngest)

| Function | File | Trigger | Purpose |
|----------|------|---------|---------|
| `generate-quiz-from-topics` | `src/lib/inngest/quiz-functions.ts` | `quiz/generate-from-topics` event | Generate quiz from selected topics with optional web supplementation |
| `generate-quiz-from-custom` | `src/lib/inngest/quiz-functions.ts` | `quiz/generate-from-custom` event | Generate quiz from free-form prompt |
| `generate-quiz-from-materials` | `src/lib/inngest/functions.ts` | `quiz/generate-from-materials` event | Generate quiz from uploaded study materials |
| `generate-topic-content` | `src/lib/inngest/functions.ts` | `topic/generate-content` event | AI-generate topic descriptions and tags |
| `generate-study-plan` | `src/lib/inngest/plan-functions.ts` | `plan/generate` event | Full study plan with web research + Pinecone context |

**Quiz Generation Flow:**
```
User Trigger → API Route → Inngest event → Inngest function → Groq LLM + optional Firecrawl web search
→ parse JSON response → upsert questions to DB → update question_set status
```

**Study Plan Generation Flow:**
```
User Trigger → API Route → Inngest event → Inngest function:
  1. Parallel: Firecrawl search topics + Pinecone query existing content
  2. Groq LLM generates curriculum (subjects, topics, resources, prerequisites)
  3. Parse JSON, store in study_plans table
→ Status polled via GET /api/agent/plan
→ Apply creates DB records via POST /api/agent/plan/[id]/apply
```

---

## 7. Vector / RAG System

### 7.1 Pinecone (Study Content Search)

| Property | Value |
|----------|-------|
| Client | `@pinecone-database/pinecone` |
| File | `src/lib/pinecone.ts` |
| Index | `spacelinear-study` |
| Dimension | Not explicitly set (depends on embedding model) |
| Namespaces | `study-plans`, `materials`, `notes`, `topics`, `resources` |

**Key functions:**
- `upsertStudyPlanChunks(namespace, chunks)` — Store plan chunks
- `searchStudyPlanChunks(namespace, query, topK)` — Semantic search
- `deleteNamespace(namespace)` — Clear namespace
- `querySimilarContent(query, namespaces, topK)` — Cross-namespace search

Used by: study plan generation for context about existing content.

### 7.2 Local Embeddings (Agent Memories)

| Property | Value |
|----------|-------|
| Library | `@xenova/transformers` |
| File | `src/lib/mochi/embeddings.ts` |
| Model | `all-MiniLM-L6-v2` (384 dimensions) |
| Storage | `agent_memories` table with `VECTOR(384)` column |
| Search | Supabase RPC `match_agent_memories` (pgvector) |

**Functions:**
- `generateEmbedding(text: string): number[]` — Generate 384-dim embedding
- `MemoryEntry` type: `{ id, user_id, content, embedding, type, metadata, created_at }`

Used by Mochi for: `storeMemory` (upsert with embedding), `searchMemory` (vector similarity search).

### 7.3 Database Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `agent_memories` | Long-term agent memory with vectors | `content`, `embedding` (VECTOR(384)), `type`, `metadata` (JSONB) |
| `agent_events` | Proactive notification queue | `event_type`, `payload` (JSONB), `notified_at` |
| `mochi_settings` | Per-user Mochi config | `enabled`, `tone`, `max_crons` |
| `mochi_crons` | Scheduled reminder jobs | `cron_expression`, `message`, `last_run` |

---

## 8. Frontend Components

| Component | File | Purpose |
|-----------|------|---------|
| `ChatInput` | `src/components/chat/ChatInput.tsx` | Full input with slash commands, @mentions, speech-to-text |
| `MessageBubble` | `src/components/chat/MessageBubble.tsx` | Markdown-rendered message display |
| `SuggestionCards` | `src/components/chat/SuggestionCards.tsx` | Smart suggestions based on due topics |
| `AgentActionCard` | `src/components/chat/AgentActionCard.tsx` | Visual card for created entities |
| `CommandMenu` | `src/components/chat/CommandMenu.tsx` | Slash command palette |
| `MentionMenu` | `src/components/chat/MentionMenu.tsx` | @mention autocomplete |
| `MochiProvider` | `src/components/mochi/MochiProvider.tsx` | Context + proactive alert polling |
| `MochiPanel` | `src/components/mochi/MochiPanel.tsx` | Floating chat panel (uses `useCompletion`) |
| `MochiBubble` | `src/components/mochi/MochiBubble.tsx` | Floating action button |
| `StudyModeChat` | `src/components/study-mode/StudyModeChat.tsx` | Inline study buddy |
| `PlanReview` | `src/components/plan/PlanReview.tsx` | Review/apply generated plans |
| `MochiSettings` | `src/views/MochiSettings.tsx` | User settings UI |

---

## 9. Speech-to-Text

Two-tier approach (`src/hooks/useSpeechToText.ts`):

| Tier | Technology | When Used |
|------|-----------|-----------|
| Primary | Web Speech API (`SpeechRecognition`) | Browser supports it natively |
| Fallback | Groq Whisper API (`/api/speech-to-text`) | Web Speech fails or unsupported |

**Flow:** `microphone → browser SpeechRecognition OR POST audio blob → Groq Whisper → transcript`

---

## 10. Prompt Management

All prompts are **hardcoded** as template literals. No centralized prompt management or versioning.

| Location | Prompt | Parameterized? |
|----------|--------|---------------|
| `src/app/api/chat/route.ts` | SpaceLinear system prompt | No |
| `src/app/api/chat/study-mode/route.ts` | Study buddy system prompt | No |
| `src/app/api/mochi/chat/route.ts` | Tool descriptions (inline) | No |
| `src/lib/mochi/prompts.ts` | Mochi general + study prompts | Yes (tone, memories, userId, date) |
| `src/lib/inngest/functions.ts` | Quiz from materials, topic content | No |
| `src/lib/inngest/quiz-functions.ts` | Quiz from topics | No |
| `src/lib/inngest/plan-functions.ts` | Study plan curriculum/title/summary | Yes (topics, web context) |
| `src/app/api/quiz/sessions/[id]/complete/route.ts` | Short-answer evaluation | Yes (question, answer) |

---

## 11. External Integrations

| Service | Usage | Auth |
|---------|-------|------|
| **Groq** | LLM inference + Whisper transcription | `GROQ_API_KEY` |
| **Pinecone** | Vector DB for study content search | `PINECONE_API_KEY`, `PINECONE_INDEX_NAME` |
| **Firecrawl** | Web search for quiz/plan supplementation | `FIRECRAWL_API_KEY` |
| **Supabase** | All data storage, auth, pgvector | `SUPABASE_SERVICE_ROLE_KEY` |
| **Web Speech API** | Browser-native speech-to-text | None (browser API) |
| **MarkItDown** (Python) | File-to-markdown conversion | Local script |

---

## 12. Environment Variables

```
GROQ_API_KEY=                     # LLM + Whisper
PINECONE_API_KEY=                 # Vector DB
PINECONE_INDEX_NAME=              # Index name
FIRECRAWL_API_KEY=                # Web search
SUPABASE_URL=                     # Database
SUPABASE_SERVICE_ROLE_KEY=        # Admin DB access
NEXT_PUBLIC_SUPABASE_URL=         # Client DB
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Client DB
INNGEST_DEV=1                     # Dev mode
```

---

## 13. Data Flow Diagrams

### Chat with Tool Execution
```
┌──────────┐     ┌──────────────┐     ┌──────────┐     ┌───────────┐
│  User    │────▶│  /api/chat   │────▶│  Groq    │────▶│  Stream   │
│  Message │     │  route.ts    │     │  LLM     │     │  Response │
└──────────┘     └──────┬───────┘     └──────────┘     └─────┬─────┘
                        │                                     │
                        ▼                                     ▼
                 ┌──────────────┐                     ┌──────────────┐
                 │ parseAction  │                     │  stripAction │
                 │ Blocks()     │                     │  Blocks()    │
                 └──────┬───────┘                     └──────────────┘
                        ▼
                 ┌──────────────┐
                 │  execute     │────▶ Supabase (create subject, topic, etc.)
                 │  Action()    │
                 └──────────────┘
```

### Mochi Agent with Memory
```
┌──────────┐     ┌──────────────┐     ┌──────────┐     ┌──────────────┐
│  User    │────▶│  /api/mochi/ │────▶│  Groq    │────▶│   Parse      │
│  Message │     │  chat        │     │  generate │     │   [ACTION]   │
└──────────┘     └──────┬───────┘     │  Text     │     └──────┬───────┘
                        │             └──────────┘            │
                        ▼                                     ▼
                 ┌──────────────┐                     ┌──────────────┐
                 │  Fetch       │                     │  Execute     │
                 │  Memories    │                     │  Tools       │
                 │  + Context   │                     │  (DB calls,  │
                 └──────┬───────┘                     │  embeddings) │
                        │                             └──────┬───────┘
                        ▼                                    │
                 ┌──────────────┐                             │
                 │  Groq        │◀────────────────────────────┘
                 │  streamText  │
                 │  (synthesize)│────▶ Streamed response to user
                 └──────────────┘
```

### Quiz Generation (Inngest Background Job)
```
┌──────────┐     ┌──────────────┐     ┌──────────┐     ┌──────────────┐
│  User    │────▶│  /api/quiz/  │────▶│  Inngest │────▶│  Groq LLM    │
│  Trigger │     │  generate    │     │  Event   │     │  + Firecrawl │
└──────────┘     └──────────────┘     └──────┬───┘     └──────┬───────┘
                                             │                │
                                             │                ▼
                                             │         ┌──────────────┐
                                             │         │  Parse JSON  │
                                             │         │  + Upsert    │
                                             │         │  Questions   │
                                             │         └──────┬───────┘
                                             │                │
                                             ▼                ▼
                                      ┌──────────────────────────┐
                                      │  Supabase question_sets  │
                                      │  + questions tables      │
                                      └──────────────────────────┘
```

### Study Plan Generation
```
┌──────────┐     ┌──────────────┐     ┌──────────────────────────────┐
│  User    │────▶│  /api/agent/ │────▶│  Inngest: generate-study-plan│
│  Trigger │     │  plan        │     └──────┬───────────┬───────────┘
└──────────┘     └──────────────┘            │           │
                                              ▼           ▼
                                      ┌──────────┐ ┌──────────┐
                                      │ Firecrawl│ │ Pinecone │
                                      │ Web      │ │ Semantic │
                                      │ Search   │ │ Search   │
                                      └────┬─────┘ └────┬─────┘
                                           │             │
                                           ▼             ▼
                                      ┌──────────────────────┐
                                      │  Groq LLM            │
                                      │  → Curriculum JSON   │
                                      └──────────┬───────────┘
                                                 ▼
                                      ┌──────────────────────┐
                                      │  Supabase study_plans│
                                      │  (status, plan_data) │
                                      └──────────────────────┘
```

---

## 14. File Index

```
src/
├── app/api/
│   ├── chat/
│   │   ├── route.ts                       # Main AI chat
│   │   └── study-mode/route.ts            # Study buddy chat
│   ├── mochi/
│   │   ├── chat/route.ts                  # Mochi agent
│   │   └── alerts/route.ts                # Proactive alerts
│   ├── agent/
│   │   ├── plan/route.ts                  # Study plan CRUD
│   │   └── plan/[id]/apply/route.ts       # Apply plan
│   ├── quiz/
│   │   ├── generate/route.ts              # Trigger quiz gen
│   │   ├── generate/[id]/status/route.ts  # Poll status
│   │   ├── reports/{daily,weekly,gaps}/   # Reports
│   │   ├── sessions/route.ts              # List sessions
│   │   └── sessions/[id]/complete/route.ts# AI eval
│   ├── speech-to-text/route.ts            # Whisper API
│   └── inngest/route.ts                   # Inngest server
├── components/
│   ├── chat/{ChatInput,MessageBubble,SuggestionCards,AgentActionCard,CommandMenu,MentionMenu}.tsx
│   ├── mochi/{MochiProvider,MochiPanel,MochiBubble}.tsx
│   ├── study-mode/StudyModeChat.tsx
│   └── plan/PlanReview.tsx
├── hooks/
│   ├── useSpeechToText.ts
│   ├── useChatStore.ts
│   └── useQuizGenerator.ts
├── lib/
│   ├── agent-tools.ts                     # Tool definitions + exec
│   ├── pinecone.ts                        # Pinecone client
│   ├── markitdown.ts                      # File converter
│   ├── types.ts                           # Shared types
│   ├── mochi/
│   │   ├── embeddings.ts                  # Xenova embeddings
│   │   ├── tools.ts                       # Mochi tools
│   │   ├── prompts.ts                     # Prompt templates
│   │   ├── types.ts                       # Mochi types
│   │   └── fileParser.ts                  # File parsing
│   └── inngest/
│       ├── client.ts                      # Inngest client
│       ├── functions.ts                   # Quiz + topic gen
│       ├── plan-functions.ts              # Study plan gen
│       └── quiz-functions.ts              # Quiz from topics
├── views/{Chat,MochiChat,MochiSettings,Pulse}.tsx
├── types/quiz.ts
└── store/useStore.ts
```
