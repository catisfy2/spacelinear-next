-- ============================================================================
-- SpaceLinear — Fix quiz RPC permissions and add missing indexes
-- ============================================================================

-- Grant authenticated users permission to call increment_session_score
-- (it was only revoked from PUBLIC, but never re-granted to authenticated)
GRANT EXECUTE ON FUNCTION public.increment_session_score TO authenticated;

-- Ensure quiz_sessions has an index on completed_at for performance queries
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_completed_at
  ON public.quiz_sessions(completed_at)
  WHERE completed_at IS NOT NULL;
