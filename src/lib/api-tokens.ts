import { generateUuidv7 } from './uuidv7'
import type { JournalApiTokenRow } from '../types/journal'

const encoder = new TextEncoder()

const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')
}

const digestToHex = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return bytesToHex(new Uint8Array(digest))
}

const createPlaintextToken = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return `jrnl_${bytesToHex(bytes)}`
}

const createTokenPrefix = (token: string): string => {
  return token.slice(0, 22)
}

export const loadUserApiTokens = async (db: D1Database, userId: string): Promise<JournalApiTokenRow[]> => {
  const result = await db
    .prepare('SELECT * FROM api_tokens WHERE user_id = ? ORDER BY created_at DESC, id DESC')
    .bind(userId)
    .all<JournalApiTokenRow>()

  return result.results
}

export const createApiToken = async ({
  db,
  userId,
  name,
}: {
  db: D1Database
  userId: string
  name: string
}): Promise<{ record: JournalApiTokenRow; plaintextToken: string }> => {
  const plaintextToken = createPlaintextToken()
  const timestamp = new Date().toISOString()
  const record: JournalApiTokenRow = {
    id: generateUuidv7(),
    user_id: userId,
    name,
    token_hash: await digestToHex(plaintextToken),
    token_prefix: createTokenPrefix(plaintextToken),
    created_at: timestamp,
    last_used_at: null,
  }

  await db
    .prepare(
      'INSERT INTO api_tokens (id, user_id, name, token_hash, token_prefix, created_at, last_used_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      record.id,
      record.user_id,
      record.name,
      record.token_hash,
      record.token_prefix,
      record.created_at,
      record.last_used_at
    )
    .run()

  return { record, plaintextToken }
}

export const deleteApiToken = async ({
  db,
  userId,
  tokenId,
}: {
  db: D1Database
  userId: string
  tokenId: string
}): Promise<boolean> => {
  const result = await db
    .prepare('DELETE FROM api_tokens WHERE id = ? AND user_id = ?')
    .bind(tokenId, userId)
    .run()

  return Number(result.meta.changes ?? 0) > 0
}
