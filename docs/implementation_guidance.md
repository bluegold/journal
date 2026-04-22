# Implementation Guidance for Coding Agents

## General priorities

1. preserve correctness of source-of-truth storage
2. keep request path simple
3. favor readable code over clever abstractions
4. isolate derived data and AI behaviors from core persistence
5. avoid introducing new infrastructure before it is needed

## What agents should not do without explicit instruction

- convert the project into a SPA
- make AI metadata authoritative by default
- collapse approved tags and AI candidate tags into one storage path
- store canonical metadata in markdown front matter only
- introduce full-text or vector search in early phases
- add Durable Objects for speculative future use
- replace normalized tags with a JSON array as the sole canonical representation

## Testing expectations

At minimum, agents should add tests for:

- entry create/update/delete flow
- D1 + R2 consistency behavior
- queue job idempotency assumptions
- tag normalization and duplicate prevention
- acceptance and discard flows for AI candidate tags
- search correctness over approved metadata only
- export serialization

## Definition of done for each phase

A phase is done only when:

- the core user-visible workflow works end to end
- migrations are committed
- relevant tests are present
- bootstrap or operator documentation is updated
- no placeholder architecture is added without active use

---

# Suggested Initial Schema Sketch

```sql
CREATE TABLE entries (
  id TEXT PRIMARY KEY,
  journal_date TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'private',
  body_key TEXT NOT NULL,
  summary TEXT,
  ai_summary TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX idx_entries_journal_date_created_at
  ON entries (journal_date DESC, created_at DESC);

CREATE INDEX idx_entries_updated_at
  ON entries (updated_at DESC);

CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE entry_tags (
  entry_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (entry_id, tag_id),
  FOREIGN KEY (entry_id) REFERENCES entries(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);

CREATE TABLE entry_ai_tags (
  entry_id TEXT NOT NULL,
  tag_text TEXT NOT NULL,
  confidence REAL,
  state TEXT NOT NULL DEFAULT 'candidate',
  generated_at TEXT NOT NULL,
  model TEXT,
  PRIMARY KEY (entry_id, tag_text),
  FOREIGN KEY (entry_id) REFERENCES entries(id)
);
```

---

# Final Development Stance

Build the smallest version that is clearly useful:

- fast write path
- great markdown editing experience
- human-approved metadata
- clean export
- search only where it already pays for itself

Everything else is optional until proven otherwise.
# Implementation Guidance for Coding Agents

# General priorities

1. preserve correctness of source-of-truth storage
2. keep request path simple
3. favor readable code over clever abstractions
4. isolate derived data and AI behaviors from core persistence
5. avoid introducing new infrastructure before it is needed

# What agents should not do without explicit instruction

- convert the project into a SPA
- make AI metadata authoritative by default
- collapse approved tags and AI candidate tags into one storage path
- store canonical metadata in markdown front matter only
- introduce full-text or vector search in early phases
- add Durable Objects for speculative future use
- replace normalized tags with a JSON array as the sole canonical representation

# Testing expectations

At minimum, agents should add tests for:

- entry create/update/delete flow
- D1 + R2 consistency behavior
- queue job idempotency assumptions
- tag normalization and duplicate prevention
- acceptance and discard flows for AI candidate tags
- search correctness over approved metadata only
- export serialization

# Definition of done for each phase

A phase is done only when:

- the core user-visible workflow works end to end
- migrations are committed
- relevant tests are present
- bootstrap or operator documentation is updated
- no placeholder architecture is added without active use

---

# Suggested Initial Schema Sketch

```sql
CREATE TABLE entries (
  id TEXT PRIMARY KEY,
  journal_date TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'private',
  body_key TEXT NOT NULL,
  summary TEXT,
  ai_summary TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX idx_entries_journal_date_created_at
  ON entries (journal_date DESC, created_at DESC);

CREATE INDEX idx_entries_updated_at
  ON entries (updated_at DESC);

CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE entry_tags (
  entry_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (entry_id, tag_id),
  FOREIGN KEY (entry_id) REFERENCES entries(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);

CREATE TABLE entry_ai_tags (
  entry_id TEXT NOT NULL,
  tag_text TEXT NOT NULL,
  confidence REAL,
  state TEXT NOT NULL DEFAULT 'candidate',
  generated_at TEXT NOT NULL,
  model TEXT,
  PRIMARY KEY (entry_id, tag_text),
  FOREIGN KEY (entry_id) REFERENCES entries(id)
);
```
