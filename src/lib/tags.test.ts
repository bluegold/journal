import { describe, expect, it } from 'vitest'
import { formatTagList, normalizeTagName, parseTagList } from './tags'

describe('tags helpers', () => {
  it('normalizes and parses tag input from commas and newlines', () => {
    expect(normalizeTagName('  Work  ')).toBe('work')
    expect(normalizeTagName('   ')).toBeNull()
    expect(parseTagList('Work, ideas\nProject, work')).toEqual(['work', 'ideas', 'project'])
    expect(formatTagList(['work', 'ideas', 'project'])).toBe('work, ideas, project')
  })
})
