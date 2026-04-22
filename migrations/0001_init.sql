CREATE TABLE entries (
  id TEXT PRIMARY KEY,
  journal_date TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  summary TEXT,
  ai_summary TEXT,
  body_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'private',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE entry_tags (
  entry_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (entry_id, tag_id),
  FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE entry_ai_tag_candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(entry_id, tag_name),
  FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
);

CREATE INDEX idx_entries_journal_date ON entries(journal_date DESC);
CREATE INDEX idx_entries_updated_at ON entries(updated_at DESC);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_ai_tag_candidates_entry_id ON entry_ai_tag_candidates(entry_id);
