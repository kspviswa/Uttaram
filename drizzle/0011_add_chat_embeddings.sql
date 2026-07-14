-- Add embedding column to chats table for topic-level embeddings
ALTER TABLE chats ADD COLUMN embedding TEXT;