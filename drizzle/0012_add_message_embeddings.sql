-- Add embedding column to messages table for user query embeddings
ALTER TABLE messages ADD COLUMN embedding TEXT;