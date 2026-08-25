CREATE TABLE IF NOT EXISTS categories(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    position INT NOT NULL DEFAULT 0,
    space_id UUID NOT NULL REFERENCES spaces(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_categories_space_id ON categories(space_id) 
WHERE deleted_at IS NULL