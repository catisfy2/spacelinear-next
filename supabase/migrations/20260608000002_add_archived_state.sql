ALTER TABLE topics DROP CONSTRAINT topics_state_check;
ALTER TABLE topics ADD CONSTRAINT topics_state_check
  CHECK (state = ANY (ARRAY['backlog'::text, 'new'::text, 'learning'::text, 'reviewing'::text, 'relearning'::text, 'archived'::text]));
