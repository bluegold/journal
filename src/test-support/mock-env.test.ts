import { describe, expect, it } from 'vitest'
import { createEntryRow, createUserRow } from './fixtures'
import { createMockEnv, createMockQueue } from './mock-env'

describe('mock env', () => {
  it('records queue messages from send and sendBatch', async () => {
    const queue = createMockQueue()

    await queue.send({ type: 'one', payload: 1 })
    await queue.sendBatch([
      { body: { type: 'two', payload: 2 } },
      { body: { type: 'three', payload: 3 } },
    ])

    expect(queue.state.messages).toEqual([
      { type: 'one', payload: 1 },
      { type: 'two', payload: 2 },
      { type: 'three', payload: 3 },
    ])
  })

  it('builds isolated D1 and R2 fixtures from options', async () => {
    const env = await createMockEnv({
      db: {
        initialUsers: [createUserRow()],
        initialEntries: [
          createEntryRow({ user_id: 'user-1', title: 'Fixture entry', summary: null, ai_summary: null }),
        ],
      },
      r2: {
        initialObjects: [
          {
            key: 'entries/entry-1.md',
            body: 'fixture body',
          },
        ],
      },
    })

    const entry = await env.DB.prepare('SELECT * FROM entries WHERE id = ? LIMIT 1').bind('entry-1').first<{
      title: string
    }>()
    const object = await env.JOURNAL_BUCKET.get('entries/entry-1.md')

    expect(entry?.title).toBe('Fixture entry')
    expect(object).not.toBeNull()
    if (!object) {
      throw new Error('Expected R2 object to exist')
    }
    await expect(object.text()).resolves.toBe('fixture body')

    await env.AI_QUEUE.send({ type: 'enrich', entryId: 'entry-1' })

    expect(env.AI_QUEUE.state.messages).toEqual([{ type: 'enrich', entryId: 'entry-1' }])
    expect(env.DB.state.entries).toHaveLength(1)
    expect(env.JOURNAL_BUCKET.state.objects.has('entries/entry-1.md')).toBe(true)
  })

  it('creates fresh env instances each time', async () => {
    const first = await createMockEnv()
    const second = await createMockEnv()

    await first.AI_QUEUE.send('first')
    await second.AI_QUEUE.send('second')

    expect(first.AI_QUEUE.state.messages).toEqual(['first'])
    expect(second.AI_QUEUE.state.messages).toEqual(['second'])
    expect(first.DB.state.queries).toEqual([])
    expect(second.DB.state.queries).toEqual([])
  })
})
