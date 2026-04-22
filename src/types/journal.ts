export type JournalEntryRow = {
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
