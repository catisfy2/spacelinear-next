-- ============================================================================
-- SpaceLinear — Quiz Generator: add columns for generation tracking + question types
-- ============================================================================

-- Add generation tracking columns to question_sets
ALTER TABLE public.question_sets ADD COLUMN IF NOT EXISTS generation_mode text;
ALTER TABLE public.question_sets ADD COLUMN IF NOT EXISTS generation_status text DEFAULT 'queued';
ALTER TABLE public.question_sets ADD COLUMN IF NOT EXISTS generation_error text;

-- Add question_type to questions (mcq | true_false | short_answer)
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_type text DEFAULT 'mcq';

-- Add new mode to quiz_sessions CHECK constraint
ALTER TABLE public.quiz_sessions DROP CONSTRAINT IF EXISTS quiz_sessions_mode_check;
ALTER TABLE public.quiz_sessions ADD CONSTRAINT quiz_sessions_mode_check
  CHECK (mode IN ('quick_practice','mock_test','topic_set','quiz'));

-- Index for generation status polling
CREATE INDEX IF NOT EXISTS idx_question_sets_gen_status ON public.question_sets(generation_status);
CREATE INDEX IF NOT EXISTS idx_question_sets_user_gen ON public.question_sets(user_id, generation_status);

-- Clean slate: truncate old quiz data
TRUNCATE TABLE public.quiz_session_answers CASCADE;
TRUNCATE TABLE public.quiz_sessions CASCADE;
TRUNCATE TABLE public.questions CASCADE;
TRUNCATE TABLE public.question_sets CASCADE;
TRUNCATE TABLE public.quiz_attempts CASCADE;
TRUNCATE TABLE public.quizzes CASCADE;

-- ============================================================================
-- Reports views
-- ============================================================================

-- Daily quiz activity report
CREATE OR REPLACE VIEW public.user_daily_quiz_report AS
WITH daily AS (
  SELECT
    qs.user_id,
    DATE(qs.completed_at) AS report_date,
    COUNT(*) AS quizzes_taken,
    SUM(qs.total_questions) AS questions_answered,
    SUM(qs.score) AS correct_answers,
    SUM(qs.time_taken_seconds) AS total_time_seconds,
    COUNT(DISTINCT q.topic_name) AS unique_topics
  FROM public.quiz_sessions qs
  LEFT JOIN public.quiz_session_answers qsa ON qsa.session_id = qs.id
  LEFT JOIN public.questions q ON q.id = qsa.question_id
  WHERE qs.completed_at IS NOT NULL
  GROUP BY qs.user_id, DATE(qs.completed_at)
)
SELECT
  user_id,
  report_date,
  quizzes_taken,
  questions_answered,
  correct_answers,
  CASE WHEN questions_answered > 0
    THEN ROUND((correct_answers::numeric / questions_answered) * 100)
    ELSE 0
  END AS accuracy,
  total_time_seconds,
  unique_topics
FROM daily;

-- Weekly quiz activity report
CREATE OR REPLACE VIEW public.user_weekly_quiz_report AS
SELECT
  user_id,
  DATE_TRUNC('week', report_date)::date AS week_start,
  SUM(quizzes_taken) AS quizzes_taken,
  SUM(questions_answered) AS questions_answered,
  SUM(correct_answers) AS correct_answers,
  CASE WHEN SUM(questions_answered) > 0
    THEN ROUND((SUM(correct_answers)::numeric / SUM(questions_answered)) * 100)
    ELSE 0
  END AS accuracy,
  SUM(total_time_seconds) AS total_time_seconds
FROM public.user_daily_quiz_report
GROUP BY user_id, DATE_TRUNC('week', report_date);

-- Topic gap analysis
CREATE OR REPLACE VIEW public.user_topic_quiz_gaps AS
SELECT
  qs.user_id,
  q.topic_name,
  q.subject_name,
  COUNT(*) AS total_attempts,
  SUM(CASE WHEN qsa.is_correct THEN 1 ELSE 0 END) AS correct_count,
  ROUND((SUM(CASE WHEN qsa.is_correct THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100) AS accuracy
FROM public.quiz_session_answers qsa
JOIN public.questions q ON q.id = qsa.question_id
JOIN public.quiz_sessions qs ON qs.id = qsa.session_id
WHERE qs.completed_at IS NOT NULL AND q.topic_name IS NOT NULL
GROUP BY qs.user_id, q.topic_name, q.subject_name
HAVING COUNT(*) >= 1
ORDER BY accuracy ASC;
