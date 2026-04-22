import { describe, expect, it } from 'vitest'
import { generateUuidv7 } from './uuidv7'

describe('generateUuidv7', () => {
  it('creates RFC 9562 style version 7 identifiers', () => {
    const value = generateUuidv7(new Date('2026-04-22T00:00:00.000Z'))

    expect(value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('generates different values for separate calls', () => {
    const first = generateUuidv7()
    const second = generateUuidv7()

    expect(first).not.toBe(second)
  })
})
