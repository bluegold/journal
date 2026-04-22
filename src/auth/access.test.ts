import { describe, expect, it } from 'vitest'
import { createUserRow } from '../test-support'
import { createMockD1 } from '../test-support/mock-d1'
import { readAccessIdentity, readDevAccessIdentity, upsertAccessUser } from './access'

describe('access bootstrap', () => {
  it('reads identity from Cloudflare Access headers', () => {
    const request = new Request('https://example.com', {
      headers: {
        'cf-access-authenticated-user-email': 'tester@example.com',
        'cf-access-authenticated-user-id': 'access-subject-1',
        'cf-access-authenticated-user-name': 'Tester',
        'cf-access-authenticated-user-avatar': 'https://example.com/avatar.png',
      },
    })

    expect(readAccessIdentity(request)).toEqual({
      accessSubject: 'access-subject-1',
      email: 'tester@example.com',
      name: 'Tester',
      avatarUrl: 'https://example.com/avatar.png',
    })
  })

  it('returns null when Access email is missing', () => {
    const request = new Request('https://example.com')

    expect(readAccessIdentity(request)).toBeNull()
  })

  it('reads a dev identity from local env values', () => {
    expect(
      readDevAccessIdentity({
        DEV_ACCESS_USER_EMAIL: 'dev@example.com',
        DEV_ACCESS_USER_ID: 'dev-subject',
        DEV_ACCESS_USER_NAME: 'Dev User',
        DEV_ACCESS_USER_AVATAR: 'https://example.com/dev.png',
      })
    ).toEqual({
      accessSubject: 'dev-subject',
      email: 'dev@example.com',
      name: 'Dev User',
      avatarUrl: 'https://example.com/dev.png',
    })
  })

  it('returns null when no dev env values are configured', () => {
    expect(readDevAccessIdentity({})).toBeNull()
  })

  it('creates or updates the current user row', async () => {
    const db = createMockD1({
      initialUsers: [createUserRow()],
    })

    const user = await upsertAccessUser(db, {
      accessSubject: 'access-subject-1',
      email: 'tester@example.com',
      name: 'Tester Updated',
      avatarUrl: 'https://example.com/avatar.png',
    })

    expect(user.id).toBe('user-1')
    expect(user.name).toBe('Tester Updated')
    expect(db.state.users).toHaveLength(1)
    expect(db.state.users[0]).toMatchObject({
      id: 'user-1',
      access_subject: 'access-subject-1',
      email: 'tester@example.com',
      name: 'Tester Updated',
      avatar_url: 'https://example.com/avatar.png',
    })
  })

  it('returns an existing user without writing when fields already match', async () => {
    const db = createMockD1({
      initialUsers: [
        createUserRow({
          avatar_url: 'https://example.com/avatar.png',
        }),
      ],
    })

    const user = await upsertAccessUser(db, {
      accessSubject: 'access-subject-1',
      email: 'tester@example.com',
      name: 'Tester',
      avatarUrl: 'https://example.com/avatar.png',
    })

    expect(user.id).toBe('user-1')
    expect(db.state.queries.some((query) => query.sql.startsWith('UPDATE users SET'))).toBe(false)
  })

  it('creates a new user when no row exists yet', async () => {
    const db = createMockD1()

    const user = await upsertAccessUser(db, {
      accessSubject: 'access-subject-2',
      email: 'writer@example.com',
      name: 'Writer',
      avatarUrl: null,
    })

    expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(db.state.users).toHaveLength(1)
    expect(db.state.users[0]).toMatchObject({
      access_subject: 'access-subject-2',
      email: 'writer@example.com',
      name: 'Writer',
      avatar_url: null,
    })
  })
})
