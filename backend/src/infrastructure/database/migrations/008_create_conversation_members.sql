CREATE TYPE role_type AS ENUM ('member', 'admin');

CREATE TABLE IF NOT EXISTS conversation_members(
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    user_id UUID NOT NULL REFERENCES users(id),
    role role_type NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_read_message_id UUID REFERENCES messages(id),
    left_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_members_user_id
ON conversation_members (user_id);