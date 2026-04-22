import { describe, expect, it } from 'vitest'
import { createMockEnv } from './mock-env'
import { createMockR2Bucket } from './mock-r2'

describe('mock R2 bucket', () => {
  it('stores, lists, and deletes objects', async () => {
    const bucket = await createMockR2Bucket({
      initialObjects: [
        {
          key: 'entries/entry-1.md',
          body: 'hello world',
        },
      ],
    })

    const existing = await bucket.get('entries/entry-1.md')
    expect(existing).not.toBeNull()
    if (!existing) {
      throw new Error('Expected R2 object to exist')
    }
    await expect(existing.text()).resolves.toBe('hello world')

    await bucket.put('entries/entry-2.md', 'second entry')

    const listed = await bucket.list()
    expect(listed.objects.map((object) => object.key)).toEqual(['entries/entry-1.md', 'entries/entry-2.md'])
    expect(bucket.state.writes).toEqual([{ key: 'entries/entry-2.md', size: 12 }])

    await bucket.delete('entries/entry-1.md')
    expect(await bucket.get('entries/entry-1.md')).toBeNull()
    expect(bucket.state.deletes).toEqual(['entries/entry-1.md'])
  })

  it('creates a complete mock env for app tests', async () => {
    const env = await createMockEnv()

    expect(env.DB).toBeDefined()
    expect(env.JOURNAL_BUCKET).toBeDefined()
    expect(env.AI_QUEUE).toBeDefined()
  })
})
