export type JournalEntryRow = {
  id: string
  user_id: string
  journal_date: string
  title: string
  summary: string | null
  ai_summary: string | null
  ai_summary_model: string | null
  ai_summary_generated_at: string | null
  body_key: string
  status: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type JournalTagRow = {
  id: number
  user_id: string
  name: string
  created_at: string | null
}

export type JournalEntryTagRow = {
  entry_id: string
  tag_id: number
  created_at: string | null
}

export type JournalEntryAiTagCandidateRow = {
  id: number
  entry_id: string
  tag_name: string
  created_at: string
}

export type JournalUserRow = {
  id: string
  access_subject: string
  email: string
  name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type JournalContextVariables = {
  currentUser: JournalUserRow
}
