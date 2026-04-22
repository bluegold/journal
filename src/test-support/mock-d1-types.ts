export type EntryRow = {
  id: string
  user_id: string
  journal_date: string
  title: string
  summary: string | null
  ai_summary: string | null
  body_key: string
  status: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type UserRow = {
  id: string
  access_subject: string
  email: string
  name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type TagRow = {
  id: number
  user_id: string
  name: string
  created_at: string | null
}

export type EntryTagRow = {
  entry_id: string
  tag_id: number
  created_at: string | null
}

export type EntryAiTagCandidateRow = {
  id: number
  entry_id: string
  tag_name: string
  created_at: string
}

export type MockD1Options = {
  initialUsers?: UserRow[]
  initialEntries?: EntryRow[]
  initialTags?: TagRow[]
  initialEntryTags?: EntryTagRow[]
  initialEntryAiTagCandidates?: EntryAiTagCandidateRow[]
}

export type MockD1State = {
  users: UserRow[]
  entries: EntryRow[]
  tags: TagRow[]
  entryTags: EntryTagRow[]
  entryAiTagCandidates: EntryAiTagCandidateRow[]
  nextUserId: number
  nextTagId: number
  nextCandidateId: number
  queries: Array<{ sql: string; params: unknown[] }>
}
