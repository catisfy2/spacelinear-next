ALTER TABLE mochi_conversations
  ADD COLUMN IF NOT EXISTS feedback TEXT
    CHECK (feedback IN ('positive', 'negative')),
  ADD COLUMN IF NOT EXISTS feedback_updated_at TIMESTAMPTZ;

CREATE POLICY "users_can_update_own_mochi_conversations"
  ON mochi_conversations FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);
