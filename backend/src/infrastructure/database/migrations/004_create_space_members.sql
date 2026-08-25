CREATE TYPE space_role_type AS ENUM ('owner', 'admin', 'member');

CREATE TABLE IF NOT EXISTS space_members (
    space_id UUID NOT NULL REFERENCES spaces(id),
    user_id UUID NOT NULL REFERENCES users(id),
    role space_role_type NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (space_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_space_members_user_id ON space_members (user_id);