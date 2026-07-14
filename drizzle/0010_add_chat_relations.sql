CREATE TABLE IF NOT EXISTS chat_relations (
  id TEXT PRIMARY KEY,
  chatId TEXT NOT NULL,
  relatedChatId TEXT NOT NULL,
  relationType TEXT NOT NULL CHECK(relationType IN ('fork', 'reference')),
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chat_relations_chatId ON chat_relations(chatId);
CREATE INDEX IF NOT EXISTS idx_chat_relations_relatedChatId ON chat_relations(relatedChatId);
CREATE INDEX IF NOT EXISTS idx_chat_relations_type ON chat_relations(relationType);
