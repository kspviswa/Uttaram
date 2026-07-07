--> statement-breakpoint
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    data TEXT NOT NULL DEFAULT '{}',
    updatedAt TEXT NOT NULL
);
