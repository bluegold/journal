export type JournalEntryRow = {
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
