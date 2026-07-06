--> statement-breakpoint
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);
--> statement-breakpoint
ALTER TABLE chats ADD COLUMN projectId TEXT REFERENCES projects(id) ON DELETE SET NULL;
