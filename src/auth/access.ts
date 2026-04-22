import { generateUuidv7 } from '../lib/uuidv7'
import type { JournalUserRow } from '../types/journal'

export type AccessIdentity = {
  accessSubject: string
  email: string
  name: string
  avatarUrl: string | null
}

type AccessEnv = {
  DEV_ACCESS_USER_EMAIL?: string
  DEV_ACCESS_USER_ID?: string
  DEV_ACCESS_USER_NAME?: string
  DEV_ACCESS_USER_AVATAR?: string
}

export const readAccessIdentity = (request: Request): AccessIdentity | null => {
  const email = request.headers.get('cf-access-authenticated-user-email')?.trim()
  if (!email) {
    return null
  }

  const accessSubject =
    request.headers.get('cf-access-authenticated-user-id')?.trim() || email
  const name = request.headers.get('cf-access-authenticated-user-name')?.trim() || email.split('@')[0] || email
  const avatarUrl = request.headers.get('cf-access-authenticated-user-avatar')?.trim() || null

  return {
    accessSubject,
    email,
    name,
    avatarUrl,
  }
}

export const readDevAccessIdentity = (env: AccessEnv): AccessIdentity | null => {
  const email = env.DEV_ACCESS_USER_EMAIL?.trim()
  if (!email) {
    return null
  }

  return {
    accessSubject: env.DEV_ACCESS_USER_ID?.trim() || email,
    email,
    name: env.DEV_ACCESS_USER_NAME?.trim() || email.split('@')[0] || email,
    avatarUrl: env.DEV_ACCESS_USER_AVATAR?.trim() || null,
  }
}

const createTimestamp = () => new Date().toISOString()

export const upsertAccessUser = async (
  db: D1Database,
  identity: AccessIdentity
): Promise<JournalUserRow> => {
  const timestamp = createTimestamp()
  const existingBySubject = await db
    .prepare('SELECT * FROM users WHERE access_subject = ? LIMIT 1')
    .bind(identity.accessSubject)
    .first<JournalUserRow>()
  const existing = existingBySubject
    ? existingBySubject
    : await db.prepare('SELECT * FROM users WHERE email = ? LIMIT 1').bind(identity.email).first<JournalUserRow>()

  if (existing) {
    const nextUser = {
      ...existing,
      access_subject: identity.accessSubject,
      email: identity.email,
      name: identity.name,
      avatar_url: identity.avatarUrl,
      updated_at: timestamp,
    }

    if (
      existing.access_subject !== nextUser.access_subject ||
      existing.email !== nextUser.email ||
      existing.name !== nextUser.name ||
      existing.avatar_url !== nextUser.avatar_url
    ) {
      await db
        .prepare(
          'UPDATE users SET access_subject = ?, email = ?, name = ?, avatar_url = ?, updated_at = ? WHERE id = ?'
        )
        .bind(
          nextUser.access_subject,
          nextUser.email,
          nextUser.name,
          nextUser.avatar_url,
          nextUser.updated_at,
          nextUser.id
        )
        .run()
      return nextUser
    }

    return existing
  }

  const createdUser: JournalUserRow = {
    id: generateUuidv7(),
    access_subject: identity.accessSubject,
    email: identity.email,
    name: identity.name,
    avatar_url: identity.avatarUrl,
    created_at: timestamp,
    updated_at: timestamp,
  }

  await db
    .prepare(
      'INSERT INTO users (id, access_subject, email, name, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      createdUser.id,
      createdUser.access_subject,
      createdUser.email,
      createdUser.name,
      createdUser.avatar_url,
      createdUser.created_at,
      createdUser.updated_at
    )
    .run()

  return createdUser
}
