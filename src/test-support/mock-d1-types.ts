export type EntryRow = {
  id: string
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

export type TagRow = {
  id: number
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
  initialEntries?: EntryRow[]
  initialTags?: TagRow[]
  initialEntryTags?: EntryTagRow[]
  initialEntryAiTagCandidates?: EntryAiTagCandidateRow[]
}

export type MockD1State = {
  entries: EntryRow[]
  tags: TagRow[]
  entryTags: EntryTagRow[]
  entryAiTagCandidates: EntryAiTagCandidateRow[]
  nextTagId: number
  nextCandidateId: number
  queries: Array<{ sql: string; params: unknown[] }>
}
