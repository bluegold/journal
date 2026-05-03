# AGENTS.md

## Mission

Build and maintain a private journal application on Cloudflare Workers using Hono and htmx.

The app is a server-rendered markdown journal, not a SPA. It prioritizes fast writes, simple operations, clean export, and cautious use of AI.

## Product Facts

- Private memo / journal app
- Multiple entries per day
- Entry IDs use UUIDv7
- Markdown body is stored in R2
- Metadata is stored in D1
- AI summary and AI tag suggestions are generated asynchronously through Queues
- AI output is assistive metadata only
- Search initially covers title, approved tags, and approved summary
- Export format is front-matter markdown files organized by date
- Markdown baseline is GitHub Flavored Markdown (GFM)
- Images and fenced code blocks are required
- Mermaid / PlantUML support is optional and lower priority

## Non-Negotiable Architecture Rules

1. **Source of truth**
   - R2 is the source of truth for markdown bodies and uploaded assets.
   - D1 is the source of truth for normalized metadata.
   - Search indexes, caches, embeddings, and AI outputs are derived data.

2. **Write path**
   - Creating or updating an entry must not wait for AI summarization/tagging.
   - The request path should save core data and enqueue background work.

3. **Rendering model**
   - Use Hono server-side rendering and htmx partial updates.
   - Do not convert the project to a client-heavy SPA unless explicitly instructed.

4. **AI boundary**
   - AI-generated summary and tags are suggestions only.
   - Human-approved metadata must remain distinct from AI candidate metadata.
   - Never silently merge AI tags into canonical tags.

5. **Search boundary**
   - Do not add full-text or semantic search in early phases unless asked.
   - Start with metadata search only: title, approved tags, approved summary.

6. **Portability**
   - Keep export as a first-class requirement.
   - Internal storage must always be convertible into front-matter markdown files.

## Data Modeling Rules

### Entries

Use an `entries` table in D1 for metadata and lifecycle fields.

Expected important columns:

- `id`
- `journal_date`
- `title`
- `status`
- `body_key`
- `summary`
- `ai_summary`
- `created_at`
- `updated_at`
- optional `deleted_at`

### Tags

Approved tags must be normalized with a junction table.

Use:

- `tags`
- `entry_tags`

Do not use a JSON array as the only canonical tag store.

### AI candidate tags

Keep AI tag candidates separate in their own table, such as `entry_ai_tags`.

Expected states:

- `candidate`
- `accepted`
- `discarded`

Approving a candidate should create or reuse a canonical tag and attach it through `entry_tags`.

## Coding Priorities

When making tradeoffs, prefer:

1. correctness
2. simplicity
3. operational clarity
4. explicit data flow
5. incremental delivery

Avoid speculative abstractions and future-proofing layers that are not yet justified.

## UI / UX Guidance

- Favor plain, durable HTML patterns.
- Use htmx for partial replacement, inline preview, and small actions.
- Keep editing responsive, but not at the cost of major front-end complexity.
- Preserve markdown fidelity.
- Make AI-generated metadata visually distinct from approved metadata.
- Provide one-click approval for AI tags.
- Provide a bulk discard action for unapproved AI tags.

## Markdown Policy

Use GitHub Flavored Markdown as the baseline.

Must support:

- fenced code blocks
- tables
- task lists
- images

For Mermaid / PlantUML in early phases:

- preserve source fences
- do not block release on special rendering support


## UI Stack Rules

Use **Tailwind CSS + Basecoat UI** as the default styling stack.

### Expectations

- Prioritize using **Basecoat UI components** (`.btn`, `.badge`, `.card`, `.button-group`, `.alert`, etc.) for new UI elements to maintain consistency and leverage the existing design system.
- Prefer Tailwind utility classes in server-rendered templates for layout and fine-grained styling.
- Use Basecoat UI where it provides simple, durable primitives that fit htmx-driven pages.
- Keep the UI readable for long markdown entries and metadata-heavy editing screens.

### Do not introduce without explicit need

- another general-purpose CSS framework
- a React-only UI kit as the main UI foundation
- CSS-in-JS for routine styling
- bespoke design system abstractions before the core app is stable

### Reuse strategy

- Extract small server-side partials or helpers for repeated UI fragments.
- Reuse class patterns intentionally, but do not over-abstract styling too early.
- Preserve compatibility with Hono SSR and htmx partial replacement.

### Visual rules

- Approved tags and AI candidate tags must look different at a glance.
- Editing screens should favor clarity over decorative density.
- Markdown reading views must preserve code block, table, and image usability.

## Queue / AI Guidance

- Queue payloads should be small and explicit.
- Consumers must be idempotent where practical.
- AI calls should request structured JSON output.
- Store generation metadata such as timestamp and model name.
- If an entry changes, do not trust stale AI results without checking freshness.

## What Not To Do

Do not, unless the user explicitly asks:

- introduce SPA state management
- add Durable Objects for speculative reasons
- make front matter the primary application database
- merge approved and candidate tags into one field
- read full R2 bodies for normal search requests
- introduce semantic search before the metadata search exists
- refactor toward a generic CMS
- replace normalized tags with a single serialized array column

## Testing Expectations

Any meaningful change should preserve or improve test coverage.

Prefer tests for:

- create/update/delete entry flows
- R2 body persistence and retrieval
- D1 metadata persistence
- queue-triggered AI enrichment behavior
- tag approval and discard flows
- search over approved metadata only
- export serialization with front matter

## Migration Discipline

- Keep schema changes explicit and reviewable.
- Add indexes intentionally.
- Avoid destructive migrations unless requested.
- If a migration changes derived data requirements, document or implement a rebuild path.

## Documentation Discipline

When behavior changes, update the relevant docs in the same work stream.

At minimum, keep these current:

- bootstrap / setup instructions
- schema expectations
- environment variable and binding requirements
- any changed developer workflow

## Preferred Development Sequence

1. foundation and bindings
2. core CRUD and markdown rendering
3. async AI enrichment
4. metadata search
5. export / portability
6. optional upgrades

## Default Style for Code Changes

- TypeScript by default
- ES modules
- small, readable functions
- explicit types on boundaries
- clear naming over clever naming
- comments only where they add real value

## Done Means

A task is not done just because code compiles.

It is done when:

- the user-facing behavior works end to end
- schema changes are included if needed
- tests are updated
- docs are updated
- the change respects the architecture rules above
