CREATE TABLE IF NOT EXISTS call_participants (
    call_id UUID NOT NULL
        REFERENCES call_sessions(id),

    user_id UUID NOT NULL
        REFERENCES users(id),

    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,

    PRIMARY KEY (call_id, user_id)
);