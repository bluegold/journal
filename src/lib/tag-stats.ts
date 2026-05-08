import type { JournalEntryRow, JournalEntryTagRow, JournalTagRow } from '../types/journal'

export type JournalTagStat = {
  id: number
  name: string
  usage_count: number
  weight: number
}

const buildEntryByIdMap = (entries: JournalEntryRow[]): Map<string, JournalEntryRow> => {
  return new Map(entries.map((entry) => [entry.id, entry] as const))
}

export const buildTagStats = (
  tags: JournalTagRow[],
  entryTags: JournalEntryTagRow[],
  entries: JournalEntryRow[],
  userId: string
): JournalTagStat[] => {
  const entryById = buildEntryByIdMap(entries)
  const usageCountByTagId = new Map<number, number>()

  for (const entryTag of entryTags) {
    const entry = entryById.get(entryTag.entry_id)
    if (!entry || entry.user_id !== userId || entry.deleted_at != null) {
      continue
    }

    usageCountByTagId.set(entryTag.tag_id, (usageCountByTagId.get(entryTag.tag_id) ?? 0) + 1)
  }

  return tags
    .filter((tag) => tag.user_id === userId)
    .map((tag) => {
      const usageCount = usageCountByTagId.get(tag.id) ?? 0

      return {
        id: tag.id,
        name: tag.name,
        usage_count: usageCount,
        weight: usageCount,
      }
    })
    .sort((a, b) => {
      if (b.weight !== a.weight) {
        return b.weight - a.weight
      }

      return a.name.localeCompare(b.name)
    })
}

export const loadTagStats = async (db: D1Database, userId: string): Promise<JournalTagStat[]> => {
  const rows = await db
    .prepare(
      `
        SELECT
          t.id,
          t.name,
          COUNT(e.id) AS usage_count
        FROM tags t
        LEFT JOIN entry_tags et ON et.tag_id = t.id
        LEFT JOIN entries e ON e.id = et.entry_id AND e.user_id = ? AND e.deleted_at IS NULL
        WHERE t.user_id = ?
        GROUP BY t.id, t.name
        ORDER BY usage_count DESC, t.name ASC
      `
    )
    .bind(userId, userId)
    .all<{ id: number; name: string; usage_count: number }>()

  return rows.results.map((row) => ({
    id: row.id,
    name: row.name,
    usage_count: row.usage_count,
    weight: row.usage_count,
  }))
}
