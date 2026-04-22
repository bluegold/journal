import type { Context } from 'hono'
import { parseDateKey } from '../lib/entries-navigation'
import type { Bindings } from '../types/bindings'
import type { JournalContextVariables, JournalEntryRow } from '../types/journal'

export type EntriesRouteContext = Context<{ Bindings: Bindings; Variables: JournalContextVariables }>

export const parseJournalDate = (value: string | null | undefined): Date => {
  return parseDateKey(value) ?? new Date()
}

export const normalizeBody = (title: string, body: string): string => {
  if (body.trim().length > 0) {
    return body
  }

  const fallbackTitle = title.trim().length > 0 ? title.trim() : 'Untitled'
  return `# ${fallbackTitle}\n`
}

export const loadUserEntries = async (c: EntriesRouteContext): Promise<JournalEntryRow[]> => {
  const rows = await c.env.DB.prepare(
    'SELECT * FROM entries WHERE user_id = ? ORDER BY journal_date DESC, created_at DESC'
  )
    .bind(c.var.currentUser.id)
    .all<JournalEntryRow>()

  return rows.results
}

export const findEntryById = (entries: JournalEntryRow[], id: string): JournalEntryRow | null => {
  return entries.find((entry) => entry.id === id && entry.deleted_at == null) ?? null
}

