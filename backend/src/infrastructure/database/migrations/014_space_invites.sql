CREATE TABLE IF NOT EXISTS space_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES spaces(id),
    code VARCHAR(12) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    max_uses INT CHECK (max_uses IS NULL OR max_uses > 0),
    uses_count INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS space_invites_code_unique ON space_invites (code);
CREATE INDEX IF NOT EXISTS idx_space_invites_space_id ON space_invites (space_id);