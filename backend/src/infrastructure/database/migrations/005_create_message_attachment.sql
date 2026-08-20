CREATE TYPE media_type AS ENUM ('image', 'video', 'audio', 'file');

CREATE TABLE IF NOT EXISTS message_attachments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id   UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  media_type   media_type NOT NULL ,
  storage_key   TEXT NOT NULL,
  thumbnail_url TEXT,
  processing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'ready', 'failed')),
  duration_seconds INT 
    CHECK (duration_seconds >= 0),
  file_size_bytes BIGINT 
    CHECK (file_size_bytes >= 0),
  mime_type    TEXT,
  width        INT 
    CHECK (width > 0),
  height       INT
    CHECK (height > 0),
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_attachment_message_id ON message_attachments(message_id)