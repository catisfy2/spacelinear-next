# SpaceLinear

Master any hard skill or topic through repetitive study and revision using spaced repetition.

## Overview

SpaceLinear is a Next.js application designed to help you learn and retain knowledge by leveraging spaced repetition techniques. Organize your learning into subjects and topics, review them on a schedule, and track your progress over time.

## Features

- **Today's Reviews** — A daily dashboard showing what's due for review so you know exactly what to study.
- **Subjects & Topics** — Organize your learning materials into structured subjects and individual topics.
- **Spaced Repetition** — Topics are scheduled for review at optimal intervals to maximize long-term retention.
- **AI-Powered Chat** — Get explanations, summaries, and study assistance through an integrated AI chat.
- **Pulse** — Visual insights into your study activity and progress over time.
- **Custom Settings** — Personalize your learning preferences and account settings.

## Tech Stack

| Layer          | Technology                                          |
| -------------- | --------------------------------------------------- |
| Framework      | [Next.js](https://nextjs.org/) (App Router)         |
| Language       | [TypeScript](https://www.typescriptlang.org/)       |
| Styling        | [Tailwind CSS](https://tailwindcss.com/)            |
| UI Library     | [shadcn/ui](https://ui.shadcn.com/)                 |
| State Mgmt     | [Zustand](https://zustand-demo.pmnd.rs/)            |
| Forms          | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| Backend / Auth | [Supabase](https://supabase.com/)                   |
| AI Integration | [AI SDK](https://sdk.vercel.ai/) (Groq)             |
| Testing        | [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (install via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd spacelinear-next

# Install dependencies
npm i

# Start the development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Commands

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `npm run dev`        | Start the development server       |
| `npm run build`      | Build for production               |
| `npm run start`      | Start the production server        |
| `npm run lint`       | Run ESLint                         |
| `npm run test`       | Run tests (Vitest)                 |
| `npm run test:watch` | Run tests in watch mode            |

## Project Structure

```
src/
├── app/                # Next.js App Router pages & API routes
│   ├── (app)/          # Authenticated app pages
│   │   ├── chat/       # AI chat assistant
│   │   ├── pulse/      # Study activity insights
│   │   ├── settings/   # User settings
│   │   ├── subjects/   # Subject management
│   │   ├── today/      # Daily review dashboard
│   │   └── topics/     # Topic management
│   ├── api/            # API routes (chat, inngest, topics)
│   └── auth/           # Authentication pages
├── components/         # Reusable UI components
├── hooks/              # Custom React hooks
├── integrations/       # Third-party integrations
├── lib/                # Utility functions
├── store/              # Zustand state stores
├── test/               # Test utilities
└── views/              # View-level components
```

## Deployment

SpaceLinear can be deployed to any platform that supports Next.js, such as Vercel, Netlify, or a custom server.

```sh
npm run build
npm run start
```
