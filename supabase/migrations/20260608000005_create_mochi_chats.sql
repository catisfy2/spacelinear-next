CREATE TABLE IF NOT EXISTS mochi_chats (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT NOT NULL,
  title       TEXT NOT NULL DEFAULT 'New Chat',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mochi_chats_user_time ON mochi_chats(user_id, updated_at DESC);

ALTER TABLE mochi_conversations ADD COLUMN IF NOT EXISTS mochi_chat_id UUID REFERENCES mochi_chats(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_mochi_conversations_chat ON mochi_conversations(mochi_chat_id);
