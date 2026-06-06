-- ============================================================================
-- SpaceLinear — Make question sets + questions shared, add topic-name bridge
-- ============================================================================

-- 1. Allow question_sets to be shared (no required owner)
ALTER TABLE public.question_sets ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add topic_name/subject_name to questions for cross-user topic matching
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS subject_name text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS topic_name text;

-- 3. Indexes for fast topic-based filtering
CREATE INDEX IF NOT EXISTS idx_questions_subject_name ON public.questions(subject_name);
CREATE INDEX IF NOT EXISTS idx_questions_topic_name ON public.questions(topic_name);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON public.questions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_questions_question_set_id ON public.questions(question_set_id);
CREATE INDEX IF NOT EXISTS idx_question_sets_topic_id ON public.question_sets(topic_id);
CREATE INDEX IF NOT EXISTS idx_question_sets_material_id ON public.question_sets(material_id);

-- 4. RLS: Shared read access on question_sets and questions
DROP POLICY IF EXISTS "Authenticated users can read shared question_sets" ON public.question_sets;
CREATE POLICY "Authenticated users can read shared question_sets"
  ON public.question_sets FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can CRUD own question_sets" ON public.question_sets;
CREATE POLICY "Users can insert question_sets"
  ON public.question_sets FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can read shared questions" ON public.questions;
CREATE POLICY "Authenticated users can read shared questions"
  ON public.questions FOR SELECT TO authenticated USING (true);

-- 5. Keep existing per-user RLS for question_sets updates (owned sets only)
CREATE POLICY "Users can update own question_sets"
  ON public.question_sets FOR UPDATE TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid())
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- ============================================================================
-- Insights / Analytics
-- ============================================================================

-- Topic study stats per user
CREATE OR REPLACE VIEW public.user_topic_study_stats AS
SELECT
  t.user_id,
  t.id AS topic_id,
  t.title AS topic_name,
  s.name AS subject_name,
  t.state,
  t.current_difficulty,
  t.total_reviews,
  t.correct_reviews,
  t.streak,
  t.next_review_date,
  t.last_reviewed_at,
  CASE
    WHEN t.total_reviews > 0
    THEN ROUND((t.correct_reviews::numeric / t.total_reviews) * 100)
    ELSE 0
  END AS srs_accuracy,
  CASE
    WHEN t.next_review_date <= now() THEN 'due'
    WHEN t.next_review_date <= now() + interval '1 day' THEN 'due_today'
    WHEN t.next_review_date <= now() + interval '7 days' THEN 'due_this_week'
    ELSE 'up_to_date'
  END AS review_status
FROM public.topics t
LEFT JOIN public.subjects s ON s.id = t.subject_id AND s.user_id = t.user_id;

-- Daily activity (study reviews + quiz sessions combined)
CREATE OR REPLACE VIEW public.user_daily_activity AS
WITH review_days AS (
  SELECT
    user_id,
    DATE(reviewed_at) AS activity_date,
    COUNT(*) AS topics_reviewed,
    COUNT(DISTINCT topic_id) AS unique_topics_reviewed
  FROM public.review_history
  GROUP BY user_id, DATE(reviewed_at)
),
quiz_days AS (
  SELECT
    user_id,
    DATE(started_at) AS activity_date,
    COUNT(*) AS quiz_sessions,
    SUM(total_questions) AS quiz_questions_answered,
    SUM(score) AS quiz_correct_answers
  FROM public.quiz_sessions
  WHERE completed_at IS NOT NULL
  GROUP BY user_id, DATE(started_at)
),
all_days AS (
  SELECT user_id, activity_date FROM review_days
  UNION
  SELECT user_id, activity_date FROM quiz_days
)
SELECT
  ad.user_id,
  ad.activity_date,
  COALESCE(rd.topics_reviewed, 0) AS topics_reviewed,
  COALESCE(rd.unique_topics_reviewed, 0) AS unique_topics_reviewed,
  COALESCE(qd.quiz_sessions, 0) AS quiz_sessions,
  COALESCE(qd.quiz_questions_answered, 0) AS quiz_questions_answered,
  COALESCE(qd.quiz_correct_answers, 0) AS quiz_correct_answers
FROM all_days ad
LEFT JOIN review_days rd ON rd.user_id = ad.user_id AND rd.activity_date = ad.activity_date
LEFT JOIN quiz_days qd ON qd.user_id = ad.user_id AND qd.activity_date = ad.activity_date
ORDER BY ad.user_id, ad.activity_date DESC;

-- Combined insights function
CREATE OR REPLACE FUNCTION public.get_user_insights(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
BEGIN
  WITH topic_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE state = 'new') AS new_count,
      COUNT(*) FILTER (WHERE state = 'learning') AS learning_count,
      COUNT(*) FILTER (WHERE state = 'reviewing') AS reviewing_count,
      COUNT(*) FILTER (WHERE state = 'relearning') AS relearning_count,
      COUNT(*) FILTER (WHERE next_review_date <= now()) AS due_count,
      ROUND(AVG(total_reviews)::numeric, 1) AS avg_reviews_per_topic,
      COALESCE(SUM(total_reviews), 0) AS total_lifetime_reviews,
      COALESCE(SUM(correct_reviews), 0) AS total_correct_reviews
    FROM public.topics
    WHERE user_id = p_user_id
  ),
  quiz_stats AS (
    SELECT
      COUNT(*) AS total_sessions,
      COUNT(*) FILTER (WHERE completed_at IS NOT NULL) AS completed_sessions,
      COALESCE(SUM(total_questions), 0) AS total_questions,
      COALESCE(SUM(score), 0) AS total_correct,
      COALESCE(ROUND((SUM(score)::numeric / NULLIF(SUM(total_questions), 0)) * 100), 0) AS overall_accuracy
    FROM public.quiz_sessions
    WHERE user_id = p_user_id
  ),
  recent_activity AS (
    SELECT
      COALESCE(
        (SELECT activity_date FROM public.user_daily_activity
         WHERE user_id = p_user_id ORDER BY activity_date DESC LIMIT 1),
        NULL::date
      ) AS last_active_date,
      (SELECT COUNT(*) FROM public.user_daily_activity
       WHERE user_id = p_user_id AND activity_date >= CURRENT_DATE - interval '7 days'
      ) AS active_days_last_7,
      (SELECT COUNT(*) FROM public.user_daily_activity
       WHERE user_id = p_user_id AND activity_date >= CURRENT_DATE - interval '30 days'
      ) AS active_days_last_30
  ),
  weakest_srs_topics AS (
    SELECT t.id, t.title, t.state, t.total_reviews, t.correct_reviews,
      CASE WHEN t.total_reviews > 0
        THEN ROUND((t.correct_reviews::numeric / t.total_reviews) * 100)
        ELSE 0
      END AS accuracy
    FROM public.topics t
    WHERE t.user_id = p_user_id AND t.total_reviews > 0
    ORDER BY accuracy ASC, t.total_reviews DESC
    LIMIT 5
  ),
  weakest_quiz_topics AS (
    SELECT
      q.topic_name AS topic_name,
      COUNT(*) AS total_attempts,
      SUM(CASE WHEN qsa.is_correct THEN 1 ELSE 0 END) AS correct_count,
      ROUND((SUM(CASE WHEN qsa.is_correct THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100) AS accuracy
    FROM public.quiz_session_answers qsa
    JOIN public.questions q ON q.id = qsa.question_id
    JOIN public.quiz_sessions qs ON qs.id = qsa.session_id
    WHERE qs.user_id = p_user_id AND qs.completed_at IS NOT NULL
    GROUP BY q.topic_name
    HAVING COUNT(*) >= 3
    ORDER BY accuracy ASC
    LIMIT 5
  )
  SELECT jsonb_build_object(
    'topicStudy', jsonb_build_object(
      'newCount', ts.new_count,
      'learningCount', ts.learning_count,
      'reviewingCount', ts.reviewing_count,
      'relearningCount', ts.relearning_count,
      'dueCount', ts.due_count,
      'avgReviewsPerTopic', ts.avg_reviews_per_topic,
      'totalLifetimeReviews', ts.total_lifetime_reviews,
      'totalCorrectReviews', ts.total_correct_reviews,
      'overallSrsAccuracy', CASE WHEN ts.total_lifetime_reviews > 0
        THEN ROUND((ts.total_correct_reviews::numeric / ts.total_lifetime_reviews) * 100)
        ELSE 0 END
    ),
    'quizPerformance', jsonb_build_object(
      'totalSessions', qs.total_sessions,
      'completedSessions', qs.completed_sessions,
      'totalQuestions', qs.total_questions,
      'totalCorrect', qs.total_correct,
      'overallAccuracy', qs.overall_accuracy
    ),
    'activity', jsonb_build_object(
      'lastActiveDate', ra.last_active_date,
      'activeDaysLast7', ra.active_days_last_7,
      'activeDaysLast30', ra.active_days_last_30
    ),
    'weakestSrsTopics', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', wt.id, 'title', wt.title, 'state', wt.state,
        'accuracy', wt.accuracy, 'totalReviews', wt.total_reviews
      )) FROM weakest_srs_topics wt), '[]'::jsonb
    ),
    'weakestQuizTopics', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'topicName', wqt.topic_name, 'accuracy', wqt.accuracy,
        'totalAttempts', wqt.total_attempts, 'correctCount', wqt.correct_count
      )) FROM weakest_quiz_topics wqt), '[]'::jsonb
    ),
    'recommendations', jsonb_build_array(
      CASE WHEN ts.due_count > 0
        THEN jsonb_build_object('type', 'review_due',
          'message', format('You have %s topics due for review. Start with your weakest topics.', ts.due_count),
          'priority', 'high')
        ELSE NULL END,
      CASE WHEN ts.learning_count > 3
        THEN jsonb_build_object('type', 'learning_overload',
          'message', format('You have %s topics in the learning phase. Focus on reviewing these before adding new ones.', ts.learning_count),
          'priority', 'medium')
        ELSE NULL END,
      CASE WHEN ra.active_days_last_7 < 3 AND qs.total_sessions > 0
        THEN jsonb_build_object('type', 'consistency',
          'message', 'Try to study at least 3 days per week for better retention.',
          'priority', 'medium')
        ELSE NULL END,
      CASE WHEN qs.overall_accuracy < 60 AND qs.total_questions >= 10
        THEN jsonb_build_object('type', 'quiz_accuracy',
          'message', format('Your quiz accuracy is %s%%. Focus on understanding core concepts before attempting harder questions.', qs.overall_accuracy),
          'priority', 'high')
        ELSE NULL END
    )
  ) INTO result
  FROM topic_stats ts, quiz_stats qs, recent_activity ra;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_insights FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_insights TO authenticated;
