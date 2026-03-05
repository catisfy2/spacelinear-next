What you have today (important for planning)

Project currently runs on Vite (dev/build/preview scripts + Vite config).

App routing is handled with react-router-dom via <BrowserRouter><Routes>....

Entry point is src/main.tsx mounting App into #root (Vite style).

You have auth/session state in a client context (AuthProvider) and Supabase client using browser localStorage auth persistence.

Alias @/* -> src/* already exists in TS config (you’ll preserve this in Next config).

Step-by-step migration process (recommended)

1) Create a migration branch and safety checkpoint

git checkout -b chore/migrate-vite-to-next
git add -A && git commit -m "chore: checkpoint before Next.js migration"

(You can skip if branch already dedicated.)

2) Install Next.js dependencies and remove Vite-only runtime pieces

Install:

npm i next@latest

You already have react and react-dom.

Then remove Vite-specific dev deps when ready:

vite

@vitejs/plugin-react-swc

lovable-tagger

These are currently Vite-specific and won’t be used by Next.

3) Update package.json scripts to Next

Replace:

"dev": "vite"

"build": "vite build"

"preview": "vite preview"

With:

"dev": "next dev"

"build": "next build"

"start": "next start"

Your current scripts are Vite-based, so this is required first for local bootstrapping.

4) Add Next.js app structure (app/ router recommended)

Create:

app/layout.tsx

app/page.tsx

app/globals.css

Move global CSS import from Vite entry to Next layout (or page):

Today CSS is imported from src/main.tsx; in Next it should be imported in app/layout.tsx (or pages/_app.tsx if using Pages Router).

5) Migrate routing from React Router to Next file-based routes

Your current routes:

/auth

/today

/topics

/topics/:id

/pulse

/subjects

/subjects/:id

/settings

fallback * route

In Next App Router, map to folders/files:

app/auth/page.tsx

app/today/page.tsx

app/topics/page.tsx

app/topics/[id]/page.tsx

app/pulse/page.tsx

app/subjects/page.tsx

app/subjects/[id]/page.tsx

app/settings/page.tsx

app/not-found.tsx (for 404)

And handle root redirect / -> /today in app/page.tsx using redirect('/today').

6) Replace BrowserRouter, Routes, Route, Navigate patterns

Your App.tsx wraps everything in BrowserRouter and uses <Navigate /> for redirects/protection.

In Next:

remove react-router-dom usage entirely

use:

next/link for links

useRouter() (client components) for imperative nav

redirect() (server components) for redirects

7) Move providers into a single Next client provider wrapper

You currently compose:

QueryClientProvider

TooltipProvider

toaster components

AuthProvider

DataLoader wrapperF:src/App.tsx†L85-L99】

In Next App Router:

Create app/providers.tsx with "use client".

Move all client-only providers there.

Import <Providers> in app/layout.tsx.

This keeps server/client boundaries clean.

8) Rebuild auth guard logic for Next

Current auth guard (ProtectedRoute) checks session/loading and redirects to /auth with <Navigate />.

In Next:

Option A (quick/client-side): create a client AuthGate component that checks auth and uses router.replace('/auth').

Option B (better, production): middleware or server checks (cookie/session based) + route protection server-side.

Because your current Supabase setup is browser-local storage oriented, client-side gate is the easiest first pass.

9) Keep Supabase client in client components only

Your Supabase client references localStorage, so it must not execute in server components.

Rules:

files using this client should be "use client" or imported only from client components.

later, if you want SSR auth, introduce separate server client (@supabase/ssr patterns).

10) Preserve TypeScript path aliases in Next

You already use @/... imports and TS path mapping.

Keep this in root tsconfig.json (Next reads it).
If needed, add jsconfig/tsconfig baseUrl and paths exactly as now.

11) Tailwind/PostCSS integration check

You already have Tailwind/PostCSS config files in root, so mostly reusable:

tailwind.config.ts

postcss.config.js

Just ensure content paths include app/**/* in addition to src/**/* after migration.

12) Handle static assets and metadata

public/ assets can stay as-is.

Convert index.html concerns (title/meta/root div) to Next layout metadata + <body> in app/layout.tsx.

Remove Vite-only index.html bootstrapping eventually.

13) Migrate tests from Vitest to Next-compatible stack (optional but recommended)

Current tests run with Vitest scripts/config.

You can either:

keep Vitest (works fine in many Next repos), or

move to Jest/RTL if team standard prefers.

No forced migration unless tooling conflicts.

14) Remove obsolete Vite files after app boots in Next

After successful next dev:

delete vite.config.ts

delete src/main.tsx

optionally remove src/vite-env.d.ts

remove Vite deps/scripts

(Do this last to keep rollback easy.)

15) Validate end-to-end

Run:

npm run dev
npm run build
npm run start
npm run test
npm run lint

Verify:

all routes render

auth redirect works

Supabase session restore works on refresh

toaster/tooltips still mount globally