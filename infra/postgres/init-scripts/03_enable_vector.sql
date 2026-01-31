-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to documents table
-- Using 384 dimensions for all-MiniLM-L6-v2 model (commonly used for local/lightweight embeddings)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS embedding vector(384);

-- Index for faster vector search (HNSW)
-- This might fail if the table is empty or has too few rows, but good to have prepared
-- CREATE INDEX ON documents USING hnsw (embedding vector_l2_ops);
