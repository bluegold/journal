# Journal API

This document is the canonical reference for programmatic use of the Journal API.

It is written for:

- coding agents
- LLM tools
- CLI scripts
- small integrations

## Authentication

All `/api/*` routes require:

```http
Authorization: Bearer <token>
```

Tokens are created from the web UI:

- open the avatar menu
- go to `APIトークン管理`
- create a named token

Notes:

- the plaintext token is shown only once
- the database stores only the token hash
- successful API requests update `api_tokens.last_used_at`

## Base rules

- Content type for write requests: `application/json`
- Dates use `YYYY-MM-DD`
- Tags are normalized to lowercase
- Markdown body is stored in R2
- Metadata is stored in D1
- AI work is asynchronous and queued
- AI summary and AI tags are suggestions, not authoritative data

## Entry object

List responses return summary objects like:

```json
{
  "id": "01969d34-5d16-7c64-bf4c-2f3d2b6c3210",
  "journalDate": "2026-05-05",
  "title": "API created entry",
  "summary": "Created from API",
  "aiSummary": null,
  "tags": ["ideas", "work"],
  "status": "private",
  "createdAt": "2026-05-05T03:12:00.000Z",
  "updatedAt": "2026-05-05T03:12:00.000Z"
}
```

Detail responses additionally include:

```json
{
  "body": "# Title\n\nMarkdown body",
  "aiSummaryModel": "@cf/meta/llama-3.2-3b-instruct",
  "aiSummaryGeneratedAt": "2026-05-05T03:12:00.000Z",
  "aiTagCandidates": ["travel", "ideas"]
}
```

## Endpoints

### `GET /api/entries`

List entries for the authenticated user.

Optional query parameters:

- `q`
  - free-text search over title and approved summary
- `tag`
  - approved tag filter
- `month`
  - `YYYY-MM`
- `date`
  - `YYYY-MM-DD`

Example:

```http
GET /api/entries?q=work&tag=ideas&month=2026-05
Authorization: Bearer <token>
```

Response:

```json
{
  "items": [
    {
      "id": "01969d34-5d16-7c64-bf4c-2f3d2b6c3210",
      "journalDate": "2026-05-05",
      "title": "Work log",
      "summary": "Project notes",
      "aiSummary": null,
      "tags": ["ideas", "work"],
      "status": "private",
      "createdAt": "2026-05-05T03:12:00.000Z",
      "updatedAt": "2026-05-05T03:12:00.000Z"
    }
  ]
}
```

### `GET /api/entries/:id`

Return one entry detail.

Errors:

- `404` if the entry does not exist for the authenticated user

### `POST /api/entries`

Create a new entry.

Request body:

```json
{
  "journalDate": "2026-05-05",
  "title": "API created entry",
  "summary": "Created from API",
  "tags": ["work", "ideas"],
  "body": "## From API\n\nBody text."
}
```

Field notes:

- `journalDate` is optional; default is today
- `title` is optional
- `summary` is optional
- `tags` may be either an array of strings or a comma/newline-delimited string
- `body` is optional; if omitted or blank, the server creates a minimal markdown title block

Response:

- `201 Created`

### `PATCH /api/entries/:id`

Update an existing entry.

This is a partial update endpoint.

Only provided fields are changed.

Request body:

```json
{
  "journalDate": "2026-05-06",
  "title": "Updated title",
  "summary": "Updated summary",
  "tags": ["ideas"],
  "body": "# Updated\n\nNew body"
}
```

Special behavior:

- `summary: null` clears the summary
- omitted `tags` keeps the existing approved tags
- changing `journalDate` updates the R2 body key path
- update re-enqueues AI summary generation

Errors:

- `400` invalid JSON
- `404` entry not found

### `DELETE /api/entries/:id`

Soft delete an entry.

Behavior:

- sets `deleted_at`
- keeps the stored markdown body in R2

Errors:

- `404` entry not found

### `POST /api/entries/:id/accept-ai-summary`

Copy the current `ai_summary` into canonical `summary`.

Errors:

- `404` entry not found
- `400` no AI summary available

### `POST /api/entries/:id/ai-tags/:tagName/accept`

Accept one AI tag candidate.

Behavior:

- creates or reuses the canonical tag
- attaches it through `entry_tags`
- removes the candidate from `entry_ai_tag_candidates`

Errors:

- `404` entry not found
- `404` candidate not found

### `POST /api/entries/:id/ai-tags/:tagName/discard`

Discard one AI tag candidate.

Errors:

- `404` entry not found
- `404` candidate not found

### `POST /api/entries/:id/ai-tags/discard-all`

Discard all AI tag candidates for the entry.

Errors:

- `404` entry not found

## Error model

Current API errors are JSON objects:

```json
{
  "error": {
    "code": "entry_not_found",
    "message": "Entry not found."
  }
}
```

Authentication failures use the same shape:

```json
{
  "error": {
    "code": "unauthorized",
    "message": "Valid API bearer token is required."
  }
}
```

All current `/api/*` endpoints use the same top-level error envelope:

```json
{
  "error": {
    "code": "machine_readable_code",
    "message": "Human readable message."
  }
}
```

Known codes currently used:

- `unauthorized`
- `invalid_json`
- `entry_not_found`
- `ai_summary_unavailable`
- `ai_tag_candidate_not_found`

## Recommended usage pattern for coding agents

1. Call `GET /api/entries` to discover candidate entries.
2. Call `GET /api/entries/:id` before mutating when body or AI metadata matters.
3. Use `POST /api/entries` for new entries.
4. Use `PATCH /api/entries/:id` for edits.
5. Use `DELETE /api/entries/:id` for removals.
6. Treat AI summary and AI tags as optional review metadata.

## cURL examples

Create:

```bash
curl -X POST "$BASE_URL/api/entries" \
  -H "Authorization: Bearer $JOURNAL_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "journalDate": "2026-05-05",
    "title": "Daily note",
    "summary": "Short summary",
    "tags": ["work", "ideas"],
    "body": "# Daily note\n\nHello from curl."
  }'
```

Update:

```bash
curl -X PATCH "$BASE_URL/api/entries/$ENTRY_ID" \
  -H "Authorization: Bearer $JOURNAL_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Updated summary",
    "tags": ["ideas"]
  }'
```

Delete:

```bash
curl -X DELETE "$BASE_URL/api/entries/$ENTRY_ID" \
  -H "Authorization: Bearer $JOURNAL_API_TOKEN"
```
