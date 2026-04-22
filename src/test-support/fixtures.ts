import type {
  EntryAiTagCandidateRow,
  EntryRow,
  EntryTagRow,
  UserRow,
  TagRow,
} from './mock-d1-types'

export const createUserRow = (overrides: Partial<UserRow> = {}): UserRow => {
  return {
    id: 'user-1',
    access_subject: 'access-subject-1',
    email: 'tester@example.com',
    name: 'Tester',
    avatar_url: null,
    created_at: '2026-04-22T00:00:00.000Z',
    updated_at: '2026-04-22T00:00:00.000Z',
    ...overrides,
  }
}

export const createEntryRow = (overrides: Partial<EntryRow> = {}): EntryRow => {
  return {
    id: 'entry-1',
    user_id: 'user-1',
    journal_date: '2026-04-22',
    title: 'First entry',
    summary: 'summary',
    ai_summary: 'ai summary',
    body_key: 'entries/entry-1.md',
    status: 'private',
    created_at: '2026-04-22T00:00:00.000Z',
    updated_at: '2026-04-22T00:00:00.000Z',
    deleted_at: null,
    ...overrides,
  }
}

export const createTagRow = (overrides: Partial<TagRow> = {}): TagRow => {
  return {
    id: 1,
    user_id: 'user-1',
    name: 'journal',
    created_at: '2026-04-22T00:00:00.000Z',
    ...overrides,
  }
}

export const createEntryTagRow = (overrides: Partial<EntryTagRow> = {}): EntryTagRow => {
  return {
    entry_id: 'entry-1',
    tag_id: 1,
    created_at: '2026-04-22T00:00:00.000Z',
    ...overrides,
  }
}

export const createEntryAiTagCandidateRow = (
  overrides: Partial<EntryAiTagCandidateRow> = {}
): EntryAiTagCandidateRow => {
  return {
    id: 1,
    entry_id: 'entry-1',
    tag_name: 'ideas',
    created_at: '2026-04-22T00:00:00.000Z',
    ...overrides,
  }
}
