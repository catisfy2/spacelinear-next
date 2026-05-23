# SpaceLinear

A personal spaced-repetition learning app. Organize knowledge into **subjects** and **topics**, review what is due on **Today**, and track progress on **Pulse**—similar to a lightweight, topic-oriented Anki.

## Features

- **Today** — Flash-card style review sessions for due topics with interval previews (Relearn / Hard / Medium / Easy)
- **Topics** — Browse all topics grouped by SRS state (relearning, learning, new, reviewing) with filters and backlog views
- **Topic detail** — Rich notes (MDX editor), resources, and review history per topic
- **Subjects** — Group topics by subject with due counts and mastery-style metrics
- **Pulse** — Analytics: due count, retention, streaks, topics-by-state chart, subject mastery
- **AI-assisted topics** — Optional background generation of descriptions and tags (Groq + Inngest)
- **Auth** — Supabase authentication with per-user data isolation

## Tech stack

| Layer | Tools |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI | React 18, [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) |
| State | [Zustand](https://zustand.docs.pmnd.rs/), [TanStack Query](https://tanstack.com/query) |
| Backend | [Supabase](https://supabase.com/) (Postgres + Auth) |
| Background jobs | [Inngest](https://www.inngest.com/) |
| AI | [Groq](https://groq.com/) via Vercel AI SDK |
| Tests | [Vitest](https://vitest.dev/) |

## Spaced repetition

Scheduling lives in `src/lib/algorithm.ts`:

- **Learning phase** (`new`, `learning`, `relearning`) — Steps at 1, 3, and 7 days; graduates to reviewing after three correct reviews (14-day interval).
- **Review phase** (`reviewing`) — Intervals scale with ease factor; ratings adjust ease (clamped between 1.3 and 3.0).
- **Ratings** — `relearn`, `hard`, `medium`, `easy` update the next review date, streak, and history entry written to Supabase.

## Project structure

```
src/
├── app/              # Next.js routes and API handlers
│   ├── (app)/        # Authenticated pages (today, topics, pulse, subjects, settings)
│   ├── api/          # Inngest webhook, topic AI generation
│   └── auth/         # Sign-in page
├── components/       # UI, shell, topics, subjects
├── hooks/            # Auth, toasts, mobile
├── integrations/     # Supabase client and generated types
├── lib/              # SRS algorithm, stats, Inngest, theme
├── store/            # Zustand store (fetch, review, CRUD)
└── views/            # Page-level view components
```

## Getting started

### Prerequisites

- Node.js 18+ and npm
- A [Supabase](https://supabase.com/) project with the app schema (`subjects`, `topics`, `review_history`, `resources`, etc.)
- (Optional) [Groq](https://console.groq.com/) API key and [Inngest](https://www.inngest.com/) for AI topic generation

### Install and run

```sh
git clone <YOUR_GIT_URL>
cd spacelinear-next
npm install
# Create .env.local with the variables listed below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root path redirects to `/today`.

### Environment variables

Create `.env.local` (or `.env`) with:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only; used by Inngest jobs) |
| `GROQ_API_KEY` | Groq API key for AI topic content (optional) |
| `INNGEST_DEV=1` | Run Inngest in dev mode locally (optional) |

Never commit real keys. Use `.env.local` and keep it out of version control.

### AI topic generation (optional)

1. Set `GROQ_API_KEY` and Supabase keys in `.env.local`.
2. Run the Next dev server: `npm run dev`.
3. Run the Inngest dev server (separate terminal): `npx inngest-cli@latest dev`.
4. Creating a topic with AI enabled queues `topic/ai.generate`; Inngest fills in description and tags.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Run Vitest in watch mode |

## Routes

| Path | Page |
| --- | --- |
| `/today` | Review session for due topics |
| `/topics` | All topics |
| `/topics/:id` | Single topic (notes, resources) |
| `/pulse` | Analytics dashboard |
| `/subjects` | Subject list |
| `/subjects/:id` | Single subject |
| `/settings` | User settings |
| `/auth` | Sign in / sign up |

## Deploy

Build and run as a standard Next.js app (e.g. [Vercel](https://vercel.com/), or any Node host with `npm run build` && `npm run start`). Configure the same environment variables in your host. For Inngest in production, connect your deployment to the Inngest cloud dashboard and register the `/api/inngest` serve endpoint.

## License

Private project — all rights reserved unless otherwise specified by the repository owner.
