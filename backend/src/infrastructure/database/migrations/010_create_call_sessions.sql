CREATE TYPE session_type AS ENUM ('1:1', 'group');

CREATE TABLE IF NOT EXISTS call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  initiated_by UUID REFERENCES users(id),
  type session_type NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE NULL,

  CHECK (ended_at IS NULL OR ended_at >= started_at)
)