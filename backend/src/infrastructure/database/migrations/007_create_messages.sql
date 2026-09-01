CREATE TYPE message_type AS ENUM ('text', 'media', 'system');

CREATE TABLE IF NOT EXISTS messages(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    type message_type NOT NULL DEFAULT 'text',
    content TEXT,
    reply_to_id UUID REFERENCES messages(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edited_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
    ON messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_reply_to
  ON messages (reply_to_id) WHERE reply_to_id IS NOT NULL;