import { describe, expect, it } from 'vitest'
import { hashApiToken } from '../auth/api-token'
import {
  createApiTokenRow,
  createEntryAiTagCandidateRow,
  createEntryRow,
  createEntryTagRow,
  createMockEnv,
  createTagRow,
  createUserRow,
} from '../test-support'
import app from '../app'

describe('api routes', () => {
  it('pings the authenticated API user', async () => {
    const plaintextToken = 'jrnl_ping'
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialApiTokens: [
          createApiTokenRow({
            name: 'Default token',
            token_hash: await hashApiToken(plaintextToken),
            last_used_at: null,
          }),
        ],
      },
    })

    const response = await app.request(
      '/api/ping',
      {
        headers: {
          authorization: `Bearer ${plaintextToken}`,
        },
      },
      env
    )
    const body = await response.json<{
      ok: boolean
      user: { id: string; email: string; name: string }
      token: { id: string; name: string }
    }>()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      ok: true,
      user: {
        id: 'user-1',
        email: 'tester@example.com',
        name: 'Tester',
      },
      token: {
        id: 'token-1',
        name: 'Default token',
      },
    })
    expect(env.DB.state.apiTokens[0]?.last_used_at).toMatch(/T/)
  })

  it('creates an entry through the bearer-token protected API', async () => {
    const plaintextToken = 'jrnl_postentry'
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialApiTokens: [
          createApiTokenRow({
            token_hash: await hashApiToken(plaintextToken),
            last_used_at: null,
          }),
        ],
      },
    })

    const response = await app.request(
      '/api/entries',
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${plaintextToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          journalDate: '2026-05-05',
          title: 'API created entry',
          summary: 'Created from API',
          tags: ['work', 'ideas'],
          body: '## From API\n\nBody text.',
        }),
      },
      env
    )
    const body = await response.json<{
      id: string
      journalDate: string
      title: string
      summary: string | null
      tags: string[]
      bodyKey: string
      status: string
    }>()

    expect(response.status).toBe(201)
    expect(body.title).toBe('API created entry')
    expect(body.summary).toBe('Created from API')
    expect(body.tags).toEqual(['ideas', 'work'])
    expect(body.journalDate).toBe('2026-05-05')
    expect(body.status).toBe('private')
    expect(env.DB.state.entries).toHaveLength(1)
    expect(env.DB.state.entryTags).toHaveLength(2)
    expect(env.AI_QUEUE.state.messages).toHaveLength(1)
    expect(env.DB.state.apiTokens[0]?.last_used_at).toMatch(/T/)
  })

  it('rejects invalid json payloads', async () => {
    const plaintextToken = 'jrnl_badjson'
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialApiTokens: [
          createApiTokenRow({
            token_hash: await hashApiToken(plaintextToken),
          }),
        ],
      },
    })

    const response = await app.request(
      '/api/entries',
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${plaintextToken}`,
          'content-type': 'application/json',
        },
        body: '{broken json',
      },
      env
    )
    const body = await response.json<{ error: string }>()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      error: {
        code: 'invalid_json',
        message: 'A valid JSON body is required.',
      },
    })
    expect(env.DB.state.entries).toHaveLength(0)
  })

  it('rejects requests without a valid bearer token', async () => {
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
      },
    })

    const response = await app.request(
      '/api/entries',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Missing auth',
        }),
      },
      env
    )
    const body = await response.json<{ error: { code: string; message: string } }>()

    expect(response.status).toBe(401)
    expect(body).toEqual({
      error: {
        code: 'unauthorized',
        message: 'Valid API bearer token is required.',
      },
    })
  })

  it('lists entries with search filters', async () => {
    const plaintextToken = 'jrnl_listentries'
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialApiTokens: [createApiTokenRow({ token_hash: await hashApiToken(plaintextToken) })],
        initialTags: [
          createTagRow({ id: 1, name: 'work' }),
          createTagRow({ id: 2, name: 'ideas' }),
        ],
        initialEntries: [
          createEntryRow({ id: 'entry-1', title: 'Work log', summary: 'Project notes' }),
          createEntryRow({ id: 'entry-2', title: 'Personal memo', summary: 'Private summary', journal_date: '2026-05-04' }),
        ],
        initialEntryTags: [
          createEntryTagRow({ entry_id: 'entry-1', tag_id: 1 }),
          createEntryTagRow({ entry_id: 'entry-2', tag_id: 2 }),
        ],
      },
    })

    const response = await app.request(
      '/api/entries?q=work&tag=work',
      { headers: { authorization: `Bearer ${plaintextToken}` } },
      env
    )
    const body = await response.json<{ items: Array<{ id: string; tags: string[] }> }>()

    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(1)
    expect(body.items[0]).toEqual(expect.objectContaining({ id: 'entry-1', tags: ['work'] }))
  })

  it('returns entry detail with body and ai candidates', async () => {
    const plaintextToken = 'jrnl_detailentry'
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialApiTokens: [createApiTokenRow({ token_hash: await hashApiToken(plaintextToken) })],
        initialTags: [createTagRow({ id: 1, name: 'work' })],
        initialEntries: [
          createEntryRow({
            id: 'entry-1',
            title: 'Detailed entry',
            ai_summary: 'AI summary text',
            ai_summary_model: '@cf/meta/llama-3.2-3b-instruct',
            ai_summary_generated_at: '2026-05-05T00:00:00.000Z',
          }),
        ],
        initialEntryTags: [createEntryTagRow({ entry_id: 'entry-1', tag_id: 1 })],
        initialEntryAiTagCandidates: [createEntryAiTagCandidateRow({ entry_id: 'entry-1', tag_name: 'ideas' })],
      },
      r2: {
        initialObjects: [{ key: 'entries/entry-1.md', body: '# Detailed\n\nBody text.' }],
      },
    })

    const response = await app.request(
      '/api/entries/entry-1',
      { headers: { authorization: `Bearer ${plaintextToken}` } },
      env
    )
    const body = await response.json<{ body: string; tags: string[]; aiTagCandidates: string[] }>()

    expect(response.status).toBe(200)
    expect(body.body).toContain('Body text.')
    expect(body.tags).toEqual(['work'])
    expect(body.aiTagCandidates).toEqual(['ideas'])
  })

  it('returns structured 404 for a missing entry detail request', async () => {
    const plaintextToken = 'jrnl_missingdetail'
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialApiTokens: [createApiTokenRow({ token_hash: await hashApiToken(plaintextToken) })],
      },
    })

    const response = await app.request(
      '/api/entries/missing-entry',
      { headers: { authorization: `Bearer ${plaintextToken}` } },
      env
    )
    const body = await response.json<{ error: { code: string; message: string } }>()

    expect(response.status).toBe(404)
    expect(body).toEqual({
      error: {
        code: 'entry_not_found',
        message: 'Entry not found.',
      },
    })
  })

  it('accepts an ai summary into the canonical summary', async () => {
    const plaintextToken = 'jrnl_acceptsummary'
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialApiTokens: [createApiTokenRow({ token_hash: await hashApiToken(plaintextToken) })],
        initialEntries: [createEntryRow({ id: 'entry-1', summary: null, ai_summary: 'Suggested summary' })],
      },
    })

    const response = await app.request(
      '/api/entries/entry-1/accept-ai-summary',
      { method: 'POST', headers: { authorization: `Bearer ${plaintextToken}` } },
      env
    )
    const body = await response.json<{ summary: string }>()

    expect(response.status).toBe(200)
    expect(body.summary).toBe('Suggested summary')
    expect(env.DB.state.entries[0]?.summary).toBe('Suggested summary')
  })

  it('returns structured 400 when ai summary is unavailable', async () => {
    const plaintextToken = 'jrnl_noaisummary'
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialApiTokens: [createApiTokenRow({ token_hash: await hashApiToken(plaintextToken) })],
        initialEntries: [createEntryRow({ id: 'entry-1', ai_summary: null })],
      },
    })

    const response = await app.request(
      '/api/entries/entry-1/accept-ai-summary',
      { method: 'POST', headers: { authorization: `Bearer ${plaintextToken}` } },
      env
    )
    const body = await response.json<{ error: { code: string; message: string } }>()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      error: {
        code: 'ai_summary_unavailable',
        message: 'AI summary is not available yet.',
      },
    })
  })

  it('accepts and discards ai tag candidates', async () => {
    const plaintextToken = 'jrnl_aitags'
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialApiTokens: [createApiTokenRow({ token_hash: await hashApiToken(plaintextToken) })],
        initialEntries: [createEntryRow({ id: 'entry-1' })],
        initialEntryAiTagCandidates: [
          createEntryAiTagCandidateRow({ entry_id: 'entry-1', tag_name: 'ideas' }),
          createEntryAiTagCandidateRow({ id: 2, entry_id: 'entry-1', tag_name: 'travel' }),
        ],
      },
    })

    const acceptResponse = await app.request(
      '/api/entries/entry-1/ai-tags/ideas/accept',
      { method: 'POST', headers: { authorization: `Bearer ${plaintextToken}` } },
      env
    )
    const acceptBody = await acceptResponse.json<{ tags: string[]; aiTagCandidates: string[] }>()

    expect(acceptResponse.status).toBe(200)
    expect(acceptBody.tags).toEqual(['ideas'])
    expect(acceptBody.aiTagCandidates).toEqual(['travel'])

    const discardAllResponse = await app.request(
      '/api/entries/entry-1/ai-tags/discard-all',
      { method: 'POST', headers: { authorization: `Bearer ${plaintextToken}` } },
      env
    )
    const discardAllBody = await discardAllResponse.json<{ aiTagCandidates: string[] }>()

    expect(discardAllResponse.status).toBe(200)
    expect(discardAllBody.aiTagCandidates).toEqual([])
  })

  it('updates an entry through the api', async () => {
    const plaintextToken = 'jrnl_updateentry'
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialApiTokens: [createApiTokenRow({ token_hash: await hashApiToken(plaintextToken) })],
        initialTags: [createTagRow({ id: 1, name: 'work' })],
        initialEntries: [
          createEntryRow({
            id: 'entry-1',
            title: 'Before title',
            summary: 'Before summary',
            body_key: 'entries/2026/05/05/entry-1.md',
            journal_date: '2026-05-05',
          }),
        ],
        initialEntryTags: [createEntryTagRow({ entry_id: 'entry-1', tag_id: 1 })],
      },
      r2: {
        initialObjects: [{ key: 'entries/2026/05/05/entry-1.md', body: '# Before\n\nBody' }],
      },
    })

    const response = await app.request(
      '/api/entries/entry-1',
      {
        method: 'PATCH',
        headers: {
          authorization: `Bearer ${plaintextToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          journalDate: '2026-05-06',
          title: 'After title',
          summary: 'After summary',
          tags: ['ideas'],
          body: '# After\n\nNew body',
        }),
      },
      env
    )
    const body = await response.json<{ title: string; tags: string[]; journalDate: string }>()

    expect(response.status).toBe(200)
    expect(body.title).toBe('After title')
    expect(body.tags).toEqual(['ideas'])
    expect(body.journalDate).toBe('2026-05-06')
    expect(env.DB.state.entries[0]?.journal_date).toBe('2026-05-06')
    expect(env.DB.state.entries[0]?.title).toBe('After title')
    expect(env.DB.state.entries[0]?.summary).toBe('After summary')
    expect(env.AI_QUEUE.state.messages).toHaveLength(1)
    expect(env.JOURNAL_BUCKET.state.deletes).toContain('entries/2026/05/05/entry-1.md')
  })

  it('soft deletes an entry through the api', async () => {
    const plaintextToken = 'jrnl_deleteentry'
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialApiTokens: [createApiTokenRow({ token_hash: await hashApiToken(plaintextToken) })],
        initialEntries: [createEntryRow({ id: 'entry-1', deleted_at: null })],
      },
    })

    const response = await app.request(
      '/api/entries/entry-1',
      {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${plaintextToken}`,
        },
      },
      env
    )
    const body = await response.json<{ deletedAt: string }>()

    expect(response.status).toBe(200)
    expect(body.deletedAt).toMatch(/T/)
    expect(env.DB.state.entries[0]?.deleted_at).toBe(body.deletedAt)
  })
})
