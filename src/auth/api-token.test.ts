import { describe, expect, it } from 'vitest'
import { createApiTokenRow, createUserRow } from '../test-support'
import { createMockD1 } from '../test-support/mock-d1'
import {
  authenticateApiToken,
  findApiTokenByPlaintext,
  hashApiToken,
  readBearerToken,
} from './api-token'

describe('api token auth', () => {
  it('reads a bearer token from the authorization header', () => {
    const request = new Request('https://example.com', {
      headers: {
        authorization: 'Bearer jrnl_testtoken',
      },
    })

    expect(readBearerToken(request)).toBe('jrnl_testtoken')
  })

  it('returns null when the authorization header is missing or malformed', () => {
    expect(readBearerToken(new Request('https://example.com'))).toBeNull()
    expect(
      readBearerToken(
        new Request('https://example.com', {
          headers: {
            authorization: 'Basic abc123',
          },
        })
      )
    ).toBeNull()
  })

  it('finds a token row from the plaintext value', async () => {
    const plaintextToken = 'jrnl_validtoken'
    const db = createMockD1({
      initialApiTokens: [
        createApiTokenRow({
          token_hash: await hashApiToken(plaintextToken),
        }),
      ],
    })

    const apiToken = await findApiTokenByPlaintext(db, plaintextToken)
    expect(apiToken?.id).toBe('token-1')
  })

  it('authenticates the user and updates last_used_at', async () => {
    const plaintextToken = 'jrnl_validtoken'
    const db = createMockD1({
      initialUsers: [createUserRow()],
      initialApiTokens: [
        createApiTokenRow({
          token_hash: await hashApiToken(plaintextToken),
          last_used_at: null,
        }),
      ],
    })

    const auth = await authenticateApiToken(
      db,
      new Request('https://example.com/api/entries', {
        headers: {
          authorization: `Bearer ${plaintextToken}`,
        },
      })
    )

    expect(auth?.user.id).toBe('user-1')
    expect(auth?.apiToken.id).toBe('token-1')
    expect(db.state.apiTokens[0]?.last_used_at).toMatch(/T/)
  })

  it('returns null when the token is unknown', async () => {
    const db = createMockD1({
      initialUsers: [createUserRow()],
      initialApiTokens: [createApiTokenRow()],
    })

    const auth = await authenticateApiToken(
      db,
      new Request('https://example.com/api/entries', {
        headers: {
          authorization: 'Bearer jrnl_unknown',
        },
      })
    )

    expect(auth).toBeNull()
  })
})
