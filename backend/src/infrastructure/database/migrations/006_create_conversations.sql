CREATE TYPE conversation_type AS ENUM ('dm','group_dm', 'channel');

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id),
    space_id UUID REFERENCES spaces(id),
    type conversation_type NOT NULL,
    name VARCHAR(100) NULL,
    position INT NOT NULL DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT channel_requires_space CHECK (
        (type = 'channel' AND space_id IS NOT NULL) OR
        (type != 'channel' AND space_id IS NULL)
    ),

    CONSTRAINT category_requires_channel CHECK (
    category_id IS NULL OR type = 'channel'
    )
);


CREATE INDEX IF NOT EXISTS idx_conversations_space_id
ON conversations (space_id) WHERE space_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_category_id
ON conversations (category_id) WHERE category_id IS NOT NULL;