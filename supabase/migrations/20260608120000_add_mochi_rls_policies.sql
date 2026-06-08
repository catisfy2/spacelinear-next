-- RLS policies for Mochi tables
-- All tables use auth.jwt() ->> 'sub' for user_id comparison (Clerk/Supabase auth)

-- mochi_settings: users can manage their own settings
CREATE POLICY "users_can_read_own_mochi_settings"
  ON mochi_settings FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "users_can_insert_own_mochi_settings"
  ON mochi_settings FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "users_can_update_own_mochi_settings"
  ON mochi_settings FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = user_id);

-- mochi_chats: users can manage their own chats
CREATE POLICY "users_can_read_own_mochi_chats"
  ON mochi_chats FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "users_can_insert_own_mochi_chats"
  ON mochi_chats FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "users_can_update_own_mochi_chats"
  ON mochi_chats FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "users_can_delete_own_mochi_chats"
  ON mochi_chats FOR DELETE
  USING ((auth.jwt() ->> 'sub') = user_id);

-- mochi_conversations: users can manage their own messages
CREATE POLICY "users_can_read_own_mochi_conversations"
  ON mochi_conversations FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "users_can_insert_own_mochi_conversations"
  ON mochi_conversations FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "users_can_delete_own_mochi_conversations"
  ON mochi_conversations FOR DELETE
  USING ((auth.jwt() ->> 'sub') = user_id);

-- study_commits: used by Mochi tools (logStudyCommit)
CREATE POLICY "users_can_read_own_study_commits"
  ON study_commits FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "users_can_insert_own_study_commits"
  ON study_commits FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- agent_memories: used by Mochi memory system
CREATE POLICY "users_can_read_own_agent_memories"
  ON agent_memories FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "users_can_insert_own_agent_memories"
  ON agent_memories FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);
