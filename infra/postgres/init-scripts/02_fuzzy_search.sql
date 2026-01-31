-- Enable pg_trgm extension for fuzzy string matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for fuzzy search on searchable_text
-- This supports similarity() and LIKE/% operators efficiently
CREATE INDEX IF NOT EXISTS documents_trgm_idx ON documents USING GIN (searchable_text gin_trgm_ops);
