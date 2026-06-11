-- Create user_roles table for admin authorization
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Admins can read all roles
CREATE POLICY "Admins can read all roles"
  ON public.user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert/update/delete roles
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add missing pitch deck sections
INSERT INTO public.docs_sections (slug, title, subtitle, category, sort_order, is_published, content)
VALUES
  ('why_now', 'Why Now', 'The timing has never been better', 'pitch', 2, true, '{
    "label": "Why Now",
    "heading": "The Perfect Timing for SpaceLinear",
    "body": "Three converging trends make this the right moment for an AI-powered learning platform:\n\n1. **AI Maturity** — Large language models have crossed the quality threshold needed for meaningful educational content generation. Groq''s ultra-low latency inference makes real-time personalized learning practical.\n\n2. **Remote Learning Boom** — Post-pandemic, the global shift to self-directed learning continues. Professionals and students alike need tools that work without a classroom structure.\n\n3. **Attention Crisis** — Modern learners face unprecedented distractions. Spaced repetition, combined with AI, offers the most efficient path to retention in a world of information overload.\n\nSpaceLinear is uniquely positioned at the intersection of AI, learning science, and modern UX to capture this moment."
  }'::jsonb),
  ('feature_matrix', 'Feature Matrix', 'What''s available, coming, and planned', 'technical', 8, true, '{
    "label": "Feature Matrix",
    "categories": [
      {
        "name": "Learning Core",
        "icon": "Brain",
        "features": [
          {"name": "Spaced Repetition Engine", "status": "live", "description": "SM-2 algorithm with custom enhancements"},
          {"name": "Topic Management", "status": "live", "description": "Create, organize, and track learning topics"},
          {"name": "Subject Organization", "status": "live", "description": "Group topics into subjects with colors and icons"},
          {"name": "Review Scheduling", "status": "live", "description": "Algorithmic scheduling based on performance"},
          {"name": "Batch Review Mode", "status": "upcoming", "description": "Review multiple topics in a focused session"}
        ]
      },
      {
        "name": "AI Features",
        "icon": "Sparkles",
        "features": [
          {"name": "AI Topic Descriptions", "status": "live", "description": "Auto-generated explanations for any topic"},
          {"name": "Quiz Generation", "status": "live", "description": "AI creates questions from your materials"},
          {"name": "Mochi AI Assistant", "status": "live", "description": "Conversational AI tutor and study assistant"},
          {"name": "Smart Recommendations", "status": "live", "description": "Personalized study suggestions"},
          {"name": "RAG Knowledge Base", "status": "live", "description": "Retrieval-augmented generation from your content"}
        ]
      },
      {
        "name": "Content Management",
        "icon": "FileText",
        "features": [
          {"name": "Rich Notes", "status": "live", "description": "Markdown editor with math support"},
          {"name": "Material Uploads", "status": "live", "description": "PDF, DOCX, images, links, text notes"},
          {"name": "Folder Organization", "status": "live", "description": "Hierarchical material management"},
          {"name": "Collaborative Editing", "status": "planned", "description": "Real-time shared editing"},
          {"name": "Browser Extension", "status": "planned", "description": "Quick capture from any webpage"}
        ]
      },
      {
        "name": "Analytics",
        "icon": "BarChart3",
        "features": [
          {"name": "Review Heatmap", "status": "live", "description": "GitHub-style activity tracker"},
          {"name": "Subject Mastery", "status": "live", "description": "Per-subject progress and retention stats"},
          {"name": "Quiz Reports", "status": "live", "description": "Detailed quiz performance analytics"},
          {"name": "Gap Analysis", "status": "live", "description": "Identify weak areas and knowledge gaps"},
          {"name": "Predictive Insights", "status": "planned", "description": "AI-powered learning predictions"}
        ]
      }
    ]
  }'::jsonb),
  ('unique_advantage', 'Unique Advantage', 'What sets SpaceLinear apart', 'pitch', 7, true, '{
    "label": "Unique Advantage",
    "advantages": [
      {
        "icon": "Zap",
        "title": "AI-First Architecture",
        "description": "Unlike traditional flashcard apps, SpaceLinear has AI at its core — generating content, personalizing schedules, and adapting in real-time."
      },
      {
        "icon": "Heart",
        "title": "Beautiful UX",
        "description": "Modern, clean interface designed for daily use. No clutter, no ads, no steep learning curves. Learning should feel good."
      },
      {
        "icon": "Shield",
        "title": "Privacy First",
        "description": "Your learning data is yours. End-to-end encryption roadmap, no data sharing, GDPR-compliant from day one."
      },
      {
        "icon": "GitBranch",
        "title": "Open Ecosystem",
        "description": "Extensible via API, import/export standards, and community templates. Not a walled garden — a platform."
      }
    ]
  }'::jsonb);

-- Add public (anon) read policies for docs tables
-- docs_sections: anon can read published
DROP POLICY IF EXISTS "Public can read published sections" ON public.docs_sections;
CREATE POLICY "Public can read published sections"
  ON public.docs_sections FOR SELECT
  USING (is_published = true);

-- docs_team_members: anon can read active members
DROP POLICY IF EXISTS "Public can read active team members" ON public.docs_team_members;
CREATE POLICY "Public can read active team members"
  ON public.docs_team_members FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated can read active team members" ON public.docs_team_members;
CREATE POLICY "Authenticated can read active team members"
  ON public.docs_team_members FOR SELECT
  USING (is_active = true);

-- docs_changelog: anon can read
DROP POLICY IF EXISTS "Public can read changelog" ON public.docs_changelog;
CREATE POLICY "Public can read changelog"
  ON public.docs_changelog FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated can read changelog" ON public.docs_changelog;
CREATE POLICY "Authenticated can read changelog"
  ON public.docs_changelog FOR SELECT
  USING (true);

-- Add idempotent fallback: if existing admin policies already use raw_user_meta_data, 
-- we keep them — these are additive policies for anon/public access.
