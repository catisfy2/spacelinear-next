CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS study_commits (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          TEXT NOT NULL,
  topic_id         UUID REFERENCES topics(id) ON DELETE SET NULL,
  subject_name     TEXT,
  topic_name       TEXT,
  duration_minutes INT NOT NULL,
  difficulty       TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard','review')),
  notes            TEXT,
  committed_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_study_commits_user_time ON study_commits(user_id, committed_at DESC);

CREATE TABLE IF NOT EXISTS agent_memories (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT NOT NULL,
  content     TEXT NOT NULL,
  embedding   VECTOR(384),
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_memories_user ON agent_memories(user_id);

CREATE TABLE IF NOT EXISTS agent_events (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      TEXT NOT NULL,
  event_type   TEXT NOT NULL,
  event_data   JSONB NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  notified_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_agent_events_user_unnotified ON agent_events(user_id) WHERE notified_at IS NULL;

CREATE TABLE IF NOT EXISTS mochi_settings (
  user_id      TEXT PRIMARY KEY,
  enabled      BOOLEAN DEFAULT true,
  tone         TEXT DEFAULT 'friendly' CHECK (tone IN ('friendly', 'professional')),
  max_crons    INT DEFAULT 3 CHECK (max_crons BETWEEN 0 AND 10),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mochi_crons (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT NOT NULL,
  label       TEXT NOT NULL,
  cron_expr   TEXT NOT NULL,
  prompt      TEXT,
  enabled     BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mochi_crons_user ON mochi_crons(user_id);

CREATE TABLE IF NOT EXISTS mochi_conversations (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     TEXT NOT NULL,
  role        TEXT NOT NULL,
  content     TEXT,
  tool_calls  JSONB,
  tool_result TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mochi_conversations_user_time ON mochi_conversations(user_id, created_at);
