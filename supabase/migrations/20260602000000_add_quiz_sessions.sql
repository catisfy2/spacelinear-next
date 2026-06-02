-- ============================================================================
-- SpaceLinear — Add quiz_sessions, quiz_session_answers, mock_test_configs
-- Note: question_sets and questions tables already exist in the database.
-- This migration only adds the missing session/config tables and columns.
-- ============================================================================

-- Add material_id column to existing question_sets table for material linkage
ALTER TABLE public.question_sets ADD COLUMN IF NOT EXISTS material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL;

-- 1. Quiz Sessions: records each practice / test attempt
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_set_id uuid REFERENCES public.question_sets(id) ON DELETE SET NULL,
  mode text NOT NULL CHECK (mode IN ('quick_practice','mock_test','topic_set')),
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  time_taken_seconds integer,
  metadata jsonb DEFAULT '{}',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- 2. Quiz Session Answers: per-question answers within a session
CREATE TABLE IF NOT EXISTS public.quiz_session_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_answer text,
  is_correct boolean NOT NULL DEFAULT false,
  time_taken_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Mock Test Configs: saved configurations for mock tests
CREATE TABLE IF NOT EXISTS public.mock_test_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  question_count integer NOT NULL DEFAULT 10,
  time_limit_minutes integer NOT NULL DEFAULT 30,
  difficulty text NOT NULL DEFAULT 'mixed' CHECK (difficulty IN ('easy','medium','hard','mixed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON public.quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_set_id ON public.quiz_sessions(question_set_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_mode ON public.quiz_sessions(mode);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_started_at ON public.quiz_sessions(started_at);

CREATE INDEX IF NOT EXISTS idx_quiz_session_answers_session_id ON public.quiz_session_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_session_answers_question_id ON public.quiz_session_answers(question_id);

CREATE INDEX IF NOT EXISTS idx_mock_test_configs_user_id ON public.mock_test_configs(user_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_session_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_test_configs ENABLE ROW LEVEL SECURITY;

-- Quiz sessions: users CRUD own
CREATE POLICY "Users can CRUD own quiz_sessions"
  ON public.quiz_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Quiz session answers: users CRUD own (via session ownership)
CREATE POLICY "Users can CRUD own quiz_session_answers"
  ON public.quiz_session_answers FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions
      WHERE quiz_sessions.id = quiz_session_answers.session_id
      AND quiz_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions
      WHERE quiz_sessions.id = session_id
      AND quiz_sessions.user_id = auth.uid()
    )
  );

-- Mock test configs: users CRUD own
CREATE POLICY "Users can CRUD own mock_test_configs"
  ON public.mock_test_configs FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Atomic score increment function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.increment_session_score(session_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.quiz_sessions
  SET score = COALESCE(score, 0) + 1
  WHERE id = session_uuid;
END;
$$;

-- ============================================================================
-- CHECK constraints
-- ============================================================================
ALTER TABLE public.quiz_sessions DROP CONSTRAINT IF EXISTS chk_quiz_score_bounds;
ALTER TABLE public.quiz_sessions ADD CONSTRAINT chk_quiz_score_bounds
  CHECK (score >= 0 AND score <= total_questions);

ALTER TABLE public.quiz_sessions DROP CONSTRAINT IF EXISTS chk_quiz_total_questions_positive;
ALTER TABLE public.quiz_sessions ADD CONSTRAINT chk_quiz_total_questions_positive
  CHECK (total_questions > 0);

ALTER TABLE public.quiz_sessions DROP CONSTRAINT IF EXISTS chk_quiz_time_nonnegative;
ALTER TABLE public.quiz_sessions ADD CONSTRAINT chk_quiz_time_nonnegative
  CHECK (time_taken_seconds IS NULL OR time_taken_seconds >= 0);

-- ============================================================================
-- UNIQUE constraint on (session_id, question_id) to prevent duplicate answers
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_session_answers_unique
  ON public.quiz_session_answers(session_id, question_id);
