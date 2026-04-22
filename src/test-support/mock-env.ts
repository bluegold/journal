import { createMockD1, type MockD1Database, type MockD1Options } from './mock-d1'
import {
  createMockR2Bucket,
  type MockR2Bucket,
  type MockR2Options,
} from './mock-r2'

export type MockEnvOptions = {
  db?: MockD1Options
  r2?: MockR2Options
}

export type MockEnv = {
  DB: MockD1Database
  JOURNAL_BUCKET: MockR2Bucket
  AI_QUEUE: Queue
}

export const createMockQueue = (): Queue => {
  const messages: unknown[] = []

  return {
    messages,
    async send(message: unknown) {
      messages.push(message)
    },
    async sendBatch(batch: Array<{ body: unknown }>) {
      for (const item of batch) {
        messages.push(item.body)
      }
    },
  } as never
}

export const createMockEnv = async (options: MockEnvOptions = {}): Promise<MockEnv> => {
  return {
    DB: createMockD1(options.db),
    JOURNAL_BUCKET: await createMockR2Bucket(options.r2),
    AI_QUEUE: createMockQueue(),
  }
}
