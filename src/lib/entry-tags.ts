import { parseTagList } from './tags'
import type { JournalEntryTagRow, JournalTagRow } from '../types/journal'

const loadTagRows = async (db: D1Database, userId: string): Promise<JournalTagRow[]> => {
  const rows = await db.prepare('SELECT * FROM tags WHERE user_id = ? ORDER BY created_at ASC, id ASC').bind(userId).all<JournalTagRow>()
  return rows.results
}

const loadEntryTagRows = async (db: D1Database, entryId: string): Promise<JournalEntryTagRow[]> => {
  const rows = await db
    .prepare('SELECT * FROM entry_tags WHERE entry_id = ? ORDER BY created_at ASC, tag_id ASC')
    .bind(entryId)
    .all<JournalEntryTagRow>()
  return rows.results
}

export const loadEntryTagNames = async (
  db: D1Database,
  userId: string,
  entryId: string
): Promise<string[]> => {
  const rows = await db
    .prepare(
      `
        SELECT DISTINCT t.name
        FROM entry_tags et
        JOIN tags t ON t.id = et.tag_id
        WHERE et.entry_id = ? AND t.user_id = ?
        ORDER BY t.name ASC
      `
    )
    .bind(entryId, userId)
    .all<{ name: string }>()

  return rows.results.map((row) => row.name)
}

export const replaceEntryTags = async (options: {
  db: D1Database
  userId: string
  entryId: string
  tagText: string
  timestamp: string
}): Promise<string[]> => {
  const desiredTagNames = parseTagList(options.tagText)
  const [tagRows, entryTagRows] = await Promise.all([
    loadTagRows(options.db, options.userId),
    loadEntryTagRows(options.db, options.entryId),
  ])
  const tagsByName = new Map(tagRows.map((tag) => [tag.name, tag] as const))
  const previousEntryTags = entryTagRows
  const createdTagIds: number[] = []

  try {
    await options.db.prepare('DELETE FROM entry_tags WHERE entry_id = ?').bind(options.entryId).run()

    for (const tagName of desiredTagNames) {
      let tag = tagsByName.get(tagName) ?? null

      if (!tag) {
        await options.db
          .prepare('INSERT INTO tags (user_id, name, created_at) VALUES (?, ?, ?)')
          .bind(options.userId, tagName, options.timestamp)
          .run()

        const refreshedTags = await loadTagRows(options.db, options.userId)
        tag = refreshedTags.find((current) => current.name === tagName) ?? null

        if (!tag) {
          throw new Error(`Failed to create tag: ${tagName}`)
        }

        tagsByName.set(tagName, tag)
        createdTagIds.push(tag.id)
      }

      await options.db
        .prepare('INSERT INTO entry_tags (entry_id, tag_id, created_at) VALUES (?, ?, ?)')
        .bind(options.entryId, tag.id, options.timestamp)
        .run()
    }
  } catch (error) {
    await options.db.prepare('DELETE FROM entry_tags WHERE entry_id = ?').bind(options.entryId).run()

    for (const entryTag of previousEntryTags) {
      await options.db
        .prepare('INSERT INTO entry_tags (entry_id, tag_id, created_at) VALUES (?, ?, ?)')
        .bind(entryTag.entry_id, entryTag.tag_id, entryTag.created_at ?? options.timestamp)
        .run()
    }

    for (const tagId of createdTagIds) {
      await options.db.prepare('DELETE FROM tags WHERE id = ?').bind(tagId).run()
    }

    throw error
  }

  return desiredTagNames
}
