import type { JournalApiTokenRow, JournalUserRow } from '../types/journal'

const encoder = new TextEncoder()

const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')
}

export const hashApiToken = async (token: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token))
  return bytesToHex(new Uint8Array(digest))
}

export const readBearerToken = (request: Request): string | null => {
  const authorization = request.headers.get('authorization')?.trim()
  if (!authorization) {
    return null
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

export const findApiTokenByPlaintext = async (
  db: D1Database,
  plaintextToken: string
): Promise<JournalApiTokenRow | null> => {
  return db
    .prepare('SELECT * FROM api_tokens WHERE token_hash = ? LIMIT 1')
    .bind(await hashApiToken(plaintextToken))
    .first<JournalApiTokenRow>()
}

export const updateApiTokenLastUsedAt = async ({
  db,
  tokenId,
  timestamp,
}: {
  db: D1Database
  tokenId: string
  timestamp: string
}): Promise<void> => {
  await db.prepare('UPDATE api_tokens SET last_used_at = ? WHERE id = ?').bind(timestamp, tokenId).run()
}

export const authenticateApiToken = async (
  db: D1Database,
  request: Request
): Promise<{ user: JournalUserRow; apiToken: JournalApiTokenRow } | null> => {
  const plaintextToken = readBearerToken(request)
  if (!plaintextToken) {
    return null
  }

  const apiToken = await findApiTokenByPlaintext(db, plaintextToken)
  if (!apiToken) {
    return null
  }

  const user = await db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').bind(apiToken.user_id).first<JournalUserRow>()
  if (!user) {
    return null
  }

  await updateApiTokenLastUsedAt({
    db,
    tokenId: apiToken.id,
    timestamp: new Date().toISOString(),
  })

  return {
    user,
    apiToken,
  }
}
