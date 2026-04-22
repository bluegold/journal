import { describe, expect, it } from 'vitest'
import { buildEntryBodyKey } from './entry-body-key'

describe('buildEntryBodyKey', () => {
  it('builds a date-partitioned markdown object key', () => {
    expect(buildEntryBodyKey(new Date(2026, 3, 22), 'uuid-123')).toBe('entries/2026/04/22/uuid-123.md')
  })
})
