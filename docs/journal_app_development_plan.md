# Journal App Development Plan

## Overview

This document defines the phased development plan for a private journal application built on Cloudflare Workers with Hono and htmx.

The goal is to keep the write path light, keep the source of truth simple, and delay complexity until it is justified by real usage.

## Product Intent

This is a **private memo / journal** application.

Core characteristics:

- private use
- multiple entries per day
- entry ID uses UUIDv7
- markdown body stored in R2
- metadata stored in D1
- AI runs asynchronously after save through Queues
- AI output is assistive metadata, never source of truth
- search initially covers title, approved tags, and summary only
- full-text / semantic search is deferred and may later use Vectorize or another Cloudflare search layer

## Architecture Principles

1. **Source of truth is explicit**
   - R2 stores the markdown body and uploaded media.
   - D1 stores normalized metadata.
   - Search indexes and AI-generated data are derived and rebuildable.

2. **Writes should be fast and predictable**
   - Save request should complete without waiting for AI summarization/tagging.
   - Queue messages trigger post-save enrichment.

3. **Human-approved metadata beats AI guesses**
   - AI-generated summary and tags are candidates.
   - User can adopt, edit, or discard them.

4. **Keep the UI server-driven**
   - SSR HTML with Hono.
   - htmx for partial updates, inline previews, and lightweight interactions.
   - Avoid SPA complexity unless a later phase proves it is needed.

5. **Export should always be possible**
   - Export produces front-matter markdown files organized by date.
   - Internal schema should not depend on front matter as the primary store.

---

## Recommended Data Model

### Why tags should use a junction table

Use a normalized tag model in D1 / SQLite:

- `tags`
- `entry_tags`

Do **not** store approved tags as a single array/blob as the primary representation.

Reasons:

- SQLite / D1 querying becomes simpler and safer.
- Exact tag filtering and tag counts are easy.
- Renaming a tag is manageable.
- Unique constraints can prevent duplicate relationships.
- Future analytics and search become much easier.

A JSON array may still be used as a **derived cache** if needed, but not as the canonical representation.

### Tables

#### `entries`

Primary metadata and lifecycle state.

Suggested columns:

- `id TEXT PRIMARY KEY` — UUIDv7
- `journal_date TEXT NOT NULL` — local date, `YYYY-MM-DD`
- `title TEXT NOT NULL DEFAULT ''`
- `status TEXT NOT NULL DEFAULT 'private'`
- `body_key TEXT NOT NULL` — R2 object key
- `summary TEXT` — human-approved summary
- `ai_summary TEXT` — AI candidate summary
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`
- `deleted_at TEXT`

Recommended indexes:

- `(journal_date DESC, created_at DESC)`
- `(status, journal_date DESC)`
- `(updated_at DESC)`

#### `tags`

Approved tag vocabulary.

Suggested columns:

- `id INTEGER PRIMARY KEY AUTOINCREMENT`
- `name TEXT NOT NULL UNIQUE`
- `created_at TEXT NOT NULL`

Normalization rule:

- trim surrounding whitespace
- preserve a display form or define canonical casing rules early
- prevent empty tags

#### `entry_tags`

Approved tag assignments.

Suggested columns:

- `entry_id TEXT NOT NULL`
- `tag_id INTEGER NOT NULL`
- `created_at TEXT NOT NULL`
- `PRIMARY KEY (entry_id, tag_id)`

#### `entry_ai_tags`

AI candidate tags, kept separate from approved tags.

Suggested columns:

- `entry_id TEXT NOT NULL`
- `tag_text TEXT NOT NULL`
- `confidence REAL`
- `state TEXT NOT NULL DEFAULT 'candidate'`
- `generated_at TEXT NOT NULL`
- `model TEXT`
- `PRIMARY KEY (entry_id, tag_text)`

`state` values:

- `candidate`
- `accepted`
- `discarded`

When a candidate is accepted:

- create or reuse a row in `tags`
- create a row in `entry_tags`
- mark the AI candidate as `accepted`

#### Optional derived tables later

- `search_documents`
- `entry_embeddings`
- `entry_assets`

---

## Markdown Policy

### Accepted format

Use **GitHub Flavored Markdown (GFM)** as the baseline authoring format.

Required support:

- headings
- emphasis
- links
- lists
- tables
- fenced code blocks
- task lists
- images
- blockquotes

### Deferred support

The following should be parsed as content but not block the initial release:

- Mermaid code fences
- PlantUML code fences

Phase 1 behavior:

- store these fences unchanged
- render them as normal fenced code blocks unless a renderer is later introduced

### Front matter policy

Front matter is **export format**, not primary storage.

Internal application state is stored in D1.
Export can synthesize front matter from D1 metadata.

---


## UI Styling Stack

### Chosen stack

Use **Tailwind CSS + Basecoat UI** for the initial UI layer.

Rationale:

- Tailwind keeps styling local and predictable in server-rendered templates.
- Basecoat UI provides a small set of prebuilt patterns without pushing the project toward SPA-style component architecture.
- The combination is suitable for Hono SSR + htmx partial rendering.

### Scope of usage

Use Tailwind for:

- layout
- spacing
- typography
- responsive behavior
- state styling
- markdown-adjacent utility styling

Use Basecoat UI for:

- buttons
- inputs
- textareas
- dialogs / drawers if needed
- cards / panels
- badges / tag chips
- dropdowns and other lightweight UI primitives where it clearly reduces custom CSS

### Constraints

- Do not introduce a second component framework for general UI.
- Do not pivot the app toward a React-only component model just to consume UI components.
- Keep SSR HTML and htmx partials as the primary rendering model.
- Prefer stable utility classes and small reusable server-side view helpers over large front-end widget abstractions.

### Theming guidance

Initial target:

- clean reading-oriented UI
- comfortable typography for long-form markdown
- dark mode support is desirable, but may follow after the first usable version if it slows delivery
- visual distinction between approved metadata and AI-generated candidate metadata must be explicit

### Markdown rendering note

Tailwind Typography may be added later if it helps markdown display, but markdown rendering correctness matters more than visual polish.

If typography helpers are introduced:

- avoid styles that break code fences, tables, or images
- keep rendered markdown readable in both editor-adjacent views and dedicated reading views

## Search Strategy

### Phase 1 search scope

Only search:

- title
- approved tags
- approved summary

This intentionally excludes full body search.

### Why this is enough initially

- cheaper to build
- faster to reason about
- avoids coupling search to R2 body reads
- aligns with the "private memo" use case

### Future search path

If search quality becomes insufficient:

1. improve summary quality and tagging
2. add a derived `search_documents` table in D1
3. consider FTS or semantic search
4. consider Vectorize for embeddings-based retrieval

Do not make AI search infrastructure a prerequisite for the first usable version.

---

## Export Format

Each exported entry should become a markdown file with YAML front matter.

Directory layout:

```text
YYYY/MM/DD/<timestamp>-<uuidv7>.md
```

Example:

```text
2026/04/22/20260422T071530-0196c4a0-....md
```

Suggested front matter:

```yaml
id: 0196c4a0-...
journal_date: 2026-04-22
created_at: 2026-04-22T07:15:30+09:00
updated_at: 2026-04-22T07:20:01+09:00
title: Example
tags:
  - rails
  - cloudflare
summary: Example summary
status: private
```

Do not include unapproved AI candidate tags in the main `tags` field.
If exported, they should be emitted under a clearly separate field such as `ai_tag_candidates`.

---

## Phase Plan

## Phase 0 — Foundation and Decision Freeze

### Goal

Create a stable project skeleton and lock the non-negotiable design choices so later agent work does not thrash.

### Exit criteria

- repository boots locally
- Workers, D1, R2, and Queue bindings are wired
- schema and naming conventions are agreed
- rendering stack and test strategy are fixed

### ToDo

- create repository structure for Worker app
- use TypeScript and ES modules
- configure Hono app entrypoint
- configure Wrangler with environments and bindings
- create local and remote D1 database setup commands
- create R2 bucket bindings for markdown bodies and media
- create Queue producer/consumer bindings
- define migration strategy
- define lint, format, and test commands
- write initial README bootstrap instructions
- add Access user bootstrap and UUIDv7 id helper
- define canonical timezone handling strategy
- decide filename and R2 object key format
- decide tag normalization rules
- decide summary acceptance/editing behavior

### Deliverables

- runnable Worker skeleton
- initial schema migration
- `wrangler.jsonc`
- local dev instructions

---

## Phase 1 — Core Journal CRUD

### Goal

Ship a usable private journal with fast save, entry listing, entry edit, markdown preview, and image/code support.

### Exit criteria

- user can create, edit, delete, and browse entries
- markdown bodies are stored in R2
- metadata is stored in D1
- preview works
- image upload and embed works
- code fences render correctly

### ToDo

- implement layout shell and basic navigation
- implement entry list page grouped by date or month
- implement entry detail / edit page
- implement create entry flow
- implement update entry flow
- implement soft delete or archive behavior
- implement markdown preview endpoint
- implement R2 body save / read logic
- implement image upload endpoint
- implement image URL strategy
- implement GFM rendering pipeline
- ensure mermaid / plantuml fences are preserved as code blocks for now
- implement optimistic UI only if it clearly simplifies UX; otherwise keep standard form flows
- add validation for title length, body size, and empty submissions
- add error handling for failed R2 and D1 writes

### Deliverables

- usable private journal MVP
- body + metadata persistence working end to end
- markdown preview and image support

---

## Phase 2 — AI Enrichment Pipeline

### Goal

Generate AI summary and AI tag candidates asynchronously after save, without affecting write latency.

### Exit criteria

- save path returns before AI work completes
- queue message is enqueued after create/update
- consumer generates candidate summary and tags
- UI can show candidate metadata separately from approved metadata

### ToDo

- define queue message schema
- enqueue a job after create and update
- implement queue consumer Worker logic
- fetch markdown body from R2 inside the consumer
- call Workers AI with structured JSON output
- persist `ai_summary` and `entry_ai_tags`
- store model name and generation timestamp
- add retry and idempotency protections
- decide how updates supersede stale AI output
- add UI sections for candidate summary and candidate tags
- add explicit "accept tag" action
- add explicit "discard all pending AI tags" action
- allow human-edited summary to overwrite AI summary pathway

### Deliverables

- non-blocking AI enrichment pipeline
- visible candidate metadata management in UI

---

## Phase 3 — Search over Approved Metadata

### Goal

Provide fast search without touching full markdown bodies.

### Exit criteria

- user can search title, approved tags, and summary
- search UX is responsive and reliable
- tag filtering works exactly

### ToDo

- implement search form and results page
- search `title`
- search approved `summary`
- search approved tags through joins
- support exact tag click filters
- add pagination or incremental loading if needed
- add "recent tags" and/or tag counts view
- make sure candidate AI tags never contaminate approved-tag search
- add tests around normalization and duplicate tags

### Deliverables

- practical metadata search
- tag-based browsing

---

## Phase 4 — Export / Backup / Portability

### Goal

Guarantee that data can leave the system cleanly.

### Exit criteria

- entries can be exported as front-matter markdown files
- export includes images or references them predictably
- restore / re-import design is at least sketched

### ToDo

- define export file naming
- generate YAML front matter from D1 metadata
- write markdown body after front matter
- decide whether to package assets into subdirectories or keep references stable
- add full export endpoint or admin action
- optionally add zip packaging
- document import expectations for future migration
- document what is source-of-truth vs derived on export

### Deliverables

- portable markdown export
- basic backup story

---

## Phase 5 — Search Upgrade Path

### Goal

Improve retrieval quality only after the lightweight metadata search proves insufficient.

### Exit criteria

- there is a measurable reason to upgrade search
- derived index strategy is defined
- migration path does not alter source-of-truth storage

### Candidate paths

#### Option A: D1-derived search table

Use a derived table built from title, approved summary, approved tags, and optionally body excerpts.

#### Option B: Embeddings / semantic search

Use a derived embeddings pipeline over selected text fields.

### ToDo

- collect real search pain points
- decide whether exact search or semantic search is the problem
- prototype derived indexing from D1/R2 sources
- benchmark latency and cost
- define reindex job flow
- define invalidation behavior after edits

### Deliverables

- documented decision on whether search should stay simple or become semantic

---

## Phase 6 — Optional Nice-to-Haves

### Goal

Add non-core features only after the core workflow is stable.

### Candidate features

- mermaid rendering
- plantuml rendering
- calendar view
- keyboard-first editing
- pin / favorite entries
- backlinks or related-entry suggestions
- semantic search
- summary regeneration controls
- multi-device upload improvements

### Rule

No Phase 6 work should delay or destabilize Phases 1 through 4.

---
