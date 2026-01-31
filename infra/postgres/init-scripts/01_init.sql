-- Enable UUID extension just in case
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content_text TEXT NOT NULL,
    searchable_text TEXT NOT NULL, -- Storing pre-processed (stemmed) text
    crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    language TEXT
);

-- Index for exact URL lookups (crawler)
CREATE INDEX IF NOT EXISTS documents_url_idx ON documents(url);

-- Full Text Search Index
-- We use 'simple' dictionary because our text is already stemmed/normalized by our custom NLP pipeline.
CREATE INDEX IF NOT EXISTS documents_search_idx ON documents USING GIN (to_tsvector('simple', searchable_text));
