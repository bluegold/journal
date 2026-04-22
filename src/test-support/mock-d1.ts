import type {
  EntryAiTagCandidateRow,
  EntryRow,
  EntryTagRow,
  MockD1Options,
  MockD1State,
  UserRow,
  TagRow,
} from './mock-d1-types'

export type { MockD1Options } from './mock-d1-types'

export type MockD1Database = D1Database & {
  state: MockD1State
}

const normalizeSql = (sql: string): string => {
  return sql.trim().replace(/\s+/g, ' ')
}

const cloneEntry = (entry: EntryRow): EntryRow => ({ ...entry })
const cloneUser = (user: UserRow): UserRow => ({ ...user })
const cloneTag = (tag: TagRow): TagRow => ({ ...tag })
const cloneEntryTag = (entryTag: EntryTagRow): EntryTagRow => ({ ...entryTag })
const cloneCandidate = (candidate: EntryAiTagCandidateRow): EntryAiTagCandidateRow => ({ ...candidate })

const deriveNextNumericId = (ids: string[]): number => {
  let max = 0

  for (const id of ids) {
    const match = id.match(/(\d+)$/)
    if (!match) {
      continue
    }

    const value = Number(match[1])
    if (!Number.isNaN(value)) {
      max = Math.max(max, value)
    }
  }

  return max + 1
}

const createInitialState = (options: MockD1Options): MockD1State => {
  const users = [...(options.initialUsers ?? [])].map(cloneUser)
  const entries = [...(options.initialEntries ?? [])].map(cloneEntry)
  const tags = [...(options.initialTags ?? [])].map(cloneTag)
  const entryTags = [...(options.initialEntryTags ?? [])].map(cloneEntryTag)
  const entryAiTagCandidates = [...(options.initialEntryAiTagCandidates ?? [])].map(cloneCandidate)

  return {
    users,
    entries,
    tags,
    entryTags,
    entryAiTagCandidates,
    nextUserId: deriveNextNumericId(users.map((user) => user.id)),
    nextTagId: tags.reduce((max, tag) => Math.max(max, tag.id), 0) + 1,
    nextCandidateId: entryAiTagCandidates.reduce((max, candidate) => Math.max(max, candidate.id), 0) + 1,
    queries: [],
  }
}

const findUserByAccessSubject = (state: MockD1State, accessSubject: string): UserRow | undefined => {
  return state.users.find((user) => user.access_subject === accessSubject)
}

const findUserByEmail = (state: MockD1State, email: string): UserRow | undefined => {
  return state.users.find((user) => user.email === email)
}

const findTagByName = (state: MockD1State, name: string): TagRow | undefined => {
  return state.tags.find((tag) => tag.name === name)
}

const parseStoredDate = (value: string | null): number => {
  if (value == null || value.length === 0) {
    return 0
  }

  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const parsed = new Date(normalized).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

const sortByCreatedAtDesc = <T extends { created_at: string | null; id: number | string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const timeA = parseStoredDate(a.created_at)
    const timeB = parseStoredDate(b.created_at)
    if (timeA !== timeB) {
      return timeB - timeA
    }

    if (typeof a.id === 'number' && typeof b.id === 'number') {
      return b.id - a.id
    }

    return String(b.id).localeCompare(String(a.id))
  })
}

const sortEntriesByJournalDateDesc = (items: EntryRow[]): EntryRow[] => {
  return [...items].sort((a, b) => {
    const journalDateA = parseStoredDate(a.journal_date)
    const journalDateB = parseStoredDate(b.journal_date)
    if (journalDateA !== journalDateB) {
      return journalDateB - journalDateA
    }

    const createdAtA = parseStoredDate(a.created_at)
    const createdAtB = parseStoredDate(b.created_at)
    if (createdAtA !== createdAtB) {
      return createdAtB - createdAtA
    }

    return String(b.id).localeCompare(String(a.id))
  })
}

const runStatement = (sql: string, params: unknown[], state: MockD1State) => {
  const normalizedSql = normalizeSql(sql)
  state.queries.push({ sql: normalizedSql, params: [...params] })

  if (normalizedSql.startsWith('INSERT INTO users')) {
    const generatedId = `user-${state.nextUserId}`
    const user: UserRow = {
      id: params[0] != null ? String(params[0]) : generatedId,
      access_subject: String(params[1] ?? ''),
      email: String(params[2] ?? ''),
      name: params[3] != null ? String(params[3]) : '',
      avatar_url: params[4] != null ? String(params[4]) : null,
      created_at: params[5] != null ? String(params[5]) : '',
      updated_at: params[6] != null ? String(params[6]) : '',
    }

    const existingByAccessSubject = findUserByAccessSubject(state, user.access_subject)
    const existingByEmail = findUserByEmail(state, user.email)
    if (existingByAccessSubject || existingByEmail) {
      return { success: true, meta: { changes: 0 } }
    }

    state.users = [...state.users, user]
    if (params[0] == null) {
      state.nextUserId += 1
    }
    return { success: true, meta: { changes: 1 } }
  }

  if (normalizedSql.startsWith('INSERT INTO entries')) {
    const userId = String(params[1] ?? params[0] ?? '')
    const entry: EntryRow = {
      id: String(params[0] ?? ''),
      user_id: params.length >= 11 ? String(params[1] ?? '') : userId,
      journal_date: String(params[params.length >= 11 ? 2 : 1] ?? ''),
      title: String(params[params.length >= 11 ? 3 : 2] ?? ''),
      summary: params[params.length >= 11 ? 4 : 3] != null ? String(params[params.length >= 11 ? 4 : 3]) : null,
      ai_summary: params[params.length >= 11 ? 5 : 4] != null ? String(params[params.length >= 11 ? 5 : 4]) : null,
      body_key: String(params[params.length >= 11 ? 6 : 5] ?? ''),
      status: String(params[params.length >= 11 ? 7 : 6] ?? 'private'),
      created_at: String(params[params.length >= 11 ? 8 : 7] ?? ''),
      updated_at: String(params[params.length >= 11 ? 9 : 8] ?? ''),
      deleted_at: params[params.length >= 11 ? 10 : 9] != null ? String(params[params.length >= 11 ? 10 : 9]) : null,
    }

    state.entries = [...state.entries.filter((current) => current.id !== entry.id), entry]
    return { success: true, meta: { changes: 1 } }
  }

  if (
    normalizedSql.startsWith(
      'UPDATE users SET access_subject = ?, email = ?, name = ?, avatar_url = ?, updated_at = ? WHERE id = ?'
    )
  ) {
    const userId = String(params[5] ?? '')
    const current = state.users.find((user) => user.id === userId)

    if (!current) {
      return { success: true, meta: { changes: 0 } }
    }

    current.access_subject = String(params[0] ?? current.access_subject)
    current.email = String(params[1] ?? current.email)
    current.name = String(params[2] ?? current.name)
    current.avatar_url = params[3] != null ? String(params[3]) : null
    current.updated_at = String(params[4] ?? current.updated_at)

    return { success: true, meta: { changes: 1 } }
  }

  if (normalizedSql.startsWith('UPDATE entries SET')) {
    const entryId = String(params[params.length - 1] ?? '')
    const current = state.entries.find((entry) => entry.id === entryId)

    if (!current) {
      return { success: true, meta: { changes: 0 } }
    }

    if (normalizedSql.includes('deleted_at = ?')) {
      current.deleted_at = params[0] != null ? String(params[0]) : null
      current.updated_at = params[1] != null ? String(params[1]) : current.updated_at
      return { success: true, meta: { changes: 1 } }
    }

    if (
      normalizedSql ===
      'UPDATE entries SET summary = ?, ai_summary = ?, body_key = ?, status = ?, updated_at = ? WHERE id = ?'
    ) {
      current.summary = params[0] != null ? String(params[0]) : null
      current.ai_summary = params[1] != null ? String(params[1]) : null
      current.body_key = params[2] != null ? String(params[2]) : current.body_key
      current.status = params[3] != null ? String(params[3]) : current.status
      current.updated_at = params[4] != null ? String(params[4]) : current.updated_at
      return { success: true, meta: { changes: 1 } }
    }

    if (
      normalizedSql ===
      'UPDATE entries SET journal_date = ?, title = ?, body_key = ?, status = ?, updated_at = ? WHERE id = ?'
    ) {
      current.journal_date = params[0] != null ? String(params[0]) : current.journal_date
      current.title = params[1] != null ? String(params[1]) : current.title
      current.body_key = params[2] != null ? String(params[2]) : current.body_key
      current.status = params[3] != null ? String(params[3]) : current.status
      current.updated_at = params[4] != null ? String(params[4]) : current.updated_at
      return { success: true, meta: { changes: 1 } }
    }
  }

  if (normalizedSql.startsWith('DELETE FROM entries')) {
    const entryId = String(params[0] ?? '')
    const before = state.entries.length
    state.entries = state.entries.filter((entry) => entry.id !== entryId)
    state.entryTags = state.entryTags.filter((entryTag) => entryTag.entry_id !== entryId)
    state.entryAiTagCandidates = state.entryAiTagCandidates.filter((candidate) => candidate.entry_id !== entryId)
    return { success: true, meta: { changes: before - state.entries.length } }
  }

  if (normalizedSql.startsWith('INSERT INTO tags')) {
    const userId = String(params.length >= 3 ? params[0] ?? '' : '')
    const name = String(params.length >= 3 ? params[1] ?? '' : params[0] ?? '').trim()
    const createdAt = params.length >= 3 ? (params[2] != null ? String(params[2]) : null) : params[1] != null ? String(params[1]) : null
    const existing = state.tags.find((tag) => tag.user_id === userId && tag.name === name)
    if (existing) {
      return { success: true, meta: { changes: 0 } }
    }

    state.tags = [...state.tags, { id: state.nextTagId, user_id: userId, name, created_at: createdAt }]
    state.nextTagId += 1
    return { success: true, meta: { changes: 1 } }
  }

  if (normalizedSql.startsWith('INSERT INTO entry_tags')) {
    const entryTag: EntryTagRow = {
      entry_id: String(params[0] ?? ''),
      tag_id: Number(params[1] ?? 0),
      created_at: params[2] != null ? String(params[2]) : null,
    }

    const existing = state.entryTags.find(
      (current) => current.entry_id === entryTag.entry_id && current.tag_id === entryTag.tag_id
    )
    if (existing) {
      return { success: true, meta: { changes: 0 } }
    }

    state.entryTags = [...state.entryTags, entryTag]
    return { success: true, meta: { changes: 1 } }
  }

  if (normalizedSql.startsWith('INSERT INTO entry_ai_tag_candidates')) {
    const candidate: EntryAiTagCandidateRow = {
      id: state.nextCandidateId,
      entry_id: String(params[0] ?? ''),
      tag_name: String(params[1] ?? ''),
      created_at: params[2] != null ? String(params[2]) : '',
    }

    const existing = state.entryAiTagCandidates.find(
      (current) => current.entry_id === candidate.entry_id && current.tag_name === candidate.tag_name
    )
    if (existing) {
      return { success: true, meta: { changes: 0 } }
    }

    state.entryAiTagCandidates = [...state.entryAiTagCandidates, candidate]
    state.nextCandidateId += 1
    return { success: true, meta: { changes: 1 } }
  }

  if (normalizedSql.startsWith('DELETE FROM entry_ai_tag_candidates')) {
    const entryId = String(params[0] ?? '')
    const tagName = params[1] != null ? String(params[1]) : null
    const before = state.entryAiTagCandidates.length

    state.entryAiTagCandidates = state.entryAiTagCandidates.filter((candidate) => {
      if (candidate.entry_id !== entryId) {
        return true
      }

      if (tagName == null) {
        return false
      }

      return candidate.tag_name !== tagName
    })

    return { success: true, meta: { changes: before - state.entryAiTagCandidates.length } }
  }

  return { success: true, meta: { changes: 0 } }
}

const allStatement = <T>(sql: string, params: unknown[], state: MockD1State) => {
  const normalizedSql = normalizeSql(sql)
  state.queries.push({ sql: normalizedSql, params: [...params] })

  if (normalizedSql.startsWith('SELECT * FROM entries WHERE user_id = ? ORDER BY journal_date DESC, created_at DESC')) {
    const userId = String(params[0] ?? '')
    return {
      results: sortEntriesByJournalDateDesc(
        state.entries.filter((entry) => entry.user_id === userId)
      ) as T[],
    }
  }

  if (normalizedSql.startsWith('SELECT * FROM entries')) {
    return { results: sortEntriesByJournalDateDesc(state.entries) as T[] }
  }

  if (normalizedSql.startsWith('SELECT * FROM users')) {
    return { results: sortByCreatedAtDesc(state.users) as T[] }
  }

  if (normalizedSql.startsWith('SELECT * FROM tags')) {
    return { results: sortByCreatedAtDesc(state.tags) as T[] }
  }

  if (normalizedSql.startsWith('SELECT * FROM entry_tags')) {
    return { results: [...state.entryTags] as T[] }
  }

  if (normalizedSql.startsWith('SELECT * FROM entry_ai_tag_candidates')) {
    return { results: sortByCreatedAtDesc(state.entryAiTagCandidates) as T[] }
  }

  return { results: [] as T[] }
}

const firstStatement = <T>(sql: string, params: unknown[], state: MockD1State) => {
  const normalizedSql = normalizeSql(sql)
  state.queries.push({ sql: normalizedSql, params: [...params] })

  if (normalizedSql.startsWith('SELECT * FROM entries WHERE id = ? LIMIT 1')) {
    const entryId = String(params[0] ?? '')
    return (state.entries.find((entry) => entry.id === entryId) ?? null) as T | null
  }

  if (normalizedSql.startsWith('SELECT * FROM users WHERE id = ? LIMIT 1')) {
    const userId = String(params[0] ?? '')
    return (state.users.find((user) => user.id === userId) ?? null) as T | null
  }

  if (normalizedSql.startsWith('SELECT * FROM users WHERE access_subject = ? LIMIT 1')) {
    const accessSubject = String(params[0] ?? '')
    return (state.users.find((user) => user.access_subject === accessSubject) ?? null) as T | null
  }

  if (normalizedSql.startsWith('SELECT * FROM users WHERE email = ? LIMIT 1')) {
    const email = String(params[0] ?? '')
    return (state.users.find((user) => user.email === email) ?? null) as T | null
  }

  if (normalizedSql.startsWith('SELECT * FROM tags WHERE id = ? LIMIT 1')) {
    const tagId = Number(params[0] ?? 0)
    return (state.tags.find((tag) => tag.id === tagId) ?? null) as T | null
  }

  if (normalizedSql.startsWith('SELECT * FROM tags WHERE name = ? LIMIT 1')) {
    const tagName = String(params[0] ?? '')
    return (state.tags.find((tag) => tag.name === tagName) ?? null) as T | null
  }

  if (normalizedSql.startsWith('SELECT * FROM entry_ai_tag_candidates WHERE entry_id = ? LIMIT 1')) {
    const entryId = String(params[0] ?? '')
    return (state.entryAiTagCandidates.find((candidate) => candidate.entry_id === entryId) ?? null) as T | null
  }

  return null
}

export const createMockD1 = (options: MockD1Options = {}): MockD1Database => {
  const state = createInitialState(options)

  const database: MockD1Database = {
    state,
    prepare(sql: string) {
      let boundParams: unknown[] = []

      return {
        bind(...params: unknown[]) {
          boundParams = params
          return this
        },
        async run() {
          return runStatement(sql, boundParams, state)
        },
        async all<T>() {
          return allStatement<T>(sql, boundParams, state)
        },
        async first<T>() {
          return firstStatement<T>(sql, boundParams, state)
        },
      }
    },
  } as MockD1Database

  return database
}
