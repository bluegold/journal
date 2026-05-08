import type { JournalEntryRow } from '../types/journal'
import { normalizeTagName } from './tags'

export type SearchEntryMatch = {
  entry: JournalEntryRow
  tagNames: string[]
}

export type SearchEntryFilters = {
  query: string
  tag?: string
  month?: string | null
  date?: string | null
}

export const loadSearchEntryMatches = async (
  db: D1Database,
  userId: string,
  filters: SearchEntryFilters
): Promise<SearchEntryMatch[]> => {
  const normalizedQuery = filters.query.trim().toLowerCase()
  const normalizedTag = normalizeTagName(filters.tag ?? '') ?? ''
  const normalizedMonth = filters.month?.trim() ?? ''
  const normalizedDate = filters.date?.trim() ?? ''

  const clauses = ['user_id = ?', 'deleted_at IS NULL']
  const params: (string | number)[] = [userId]

  if (normalizedDate.length > 0) {
    clauses.push('journal_date = ?')
    params.push(normalizedDate)
  } else if (normalizedMonth.length > 0) {
    clauses.push('journal_date LIKE ?')
    params.push(`${normalizedMonth}%`)
  }

  if (normalizedQuery.length > 0) {
    clauses.push('(LOWER(title) LIKE ? OR LOWER(COALESCE(summary, \'\')) LIKE ?)')
    const queryPattern = `%${normalizedQuery}%`
    params.push(queryPattern, queryPattern)
  }

  if (normalizedTag.length > 0) {
    clauses.push(`
      EXISTS (
        SELECT 1
        FROM entry_tags et
        JOIN tags t ON t.id = et.tag_id
        WHERE et.entry_id = entries.id
          AND t.user_id = ?
          AND t.name = ?
      )
    `.trim())
    params.push(userId, normalizedTag)
  }

  const entryRows = await db
    .prepare(
      `
        SELECT *
        FROM entries
        WHERE ${clauses.join(' AND ')}
        ORDER BY journal_date DESC, created_at DESC
      `
    )
    .bind(...params)
    .all<JournalEntryRow>()

  if (entryRows.results.length === 0) {
    return []
  }

  const entryIds = entryRows.results.map((entry) => entry.id)
  const placeholders = entryIds.map(() => '?').join(', ')
  const tagRows = await db
    .prepare(
      `
        SELECT et.entry_id, t.name
        FROM entry_tags et
        JOIN tags t ON t.id = et.tag_id
        WHERE et.entry_id IN (${placeholders}) AND t.user_id = ?
        ORDER BY et.entry_id ASC, t.name ASC
      `
    )
    .bind(...entryIds, userId)
    .all<{ entry_id: string; name: string }>()

  const tagNamesByEntryId = new Map<string, string[]>()
  for (const row of tagRows.results) {
    const current = tagNamesByEntryId.get(row.entry_id) ?? []
    current.push(row.name)
    tagNamesByEntryId.set(row.entry_id, current)
  }

  return entryRows.results.map((entry) => ({
    entry,
    tagNames: [...new Set(tagNamesByEntryId.get(entry.id) ?? [])].sort((a, b) => a.localeCompare(b)),
  }))
}
