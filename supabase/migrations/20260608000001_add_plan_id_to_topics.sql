ALTER TABLE topics
  ADD COLUMN plan_id UUID REFERENCES study_plans(id) ON DELETE SET NULL;

CREATE INDEX idx_topics_plan_id ON topics(plan_id);
