import { createMockD1, type MockD1Database, type MockD1Options } from './mock-d1'
import {
  createMockR2Bucket,
  type MockR2Bucket,
  type MockR2Options,
} from './mock-r2'

export type MockEnvOptions = {
  db?: MockD1Options
  r2?: MockR2Options
  ai?: {
    summary?: string
    tags?: string[]
    summaryError?: string
    tagsError?: string
  }
  ACCESS_LOGOUT_URL?: string
}

export type MockQueueState = {
  messages: unknown[]
}

export type MockQueue = Queue & {
  state: MockQueueState
}

export type MockAiState = {
  calls: Array<{
    model: string
    inputs: Record<string, unknown>
  }>
  summary: string
  tags: string[]
}

export type MockAi = Ai & {
  state: MockAiState
}

export type MockEnv = {
  DB: MockD1Database
  JOURNAL_BUCKET: MockR2Bucket
  AI_QUEUE: MockQueue
  AI: MockAi
  ACCESS_LOGOUT_URL?: string
}

export const createMockQueue = (): MockQueue => {
  const state: MockQueueState = {
    messages: [],
  }

  return {
    state,
    async send(message: unknown) {
      state.messages.push(message)
    },
    async sendBatch(batch: Array<{ body: unknown }>) {
      for (const item of batch) {
        state.messages.push(item.body)
      }
    },
  } as never
}

export const createMockAi = (options: MockEnvOptions['ai'] = {}): MockAi => {
  const state: MockAiState = {
    calls: [],
    summary: options?.summary ?? 'AI summary',
    tags: options?.tags ?? ['planning', 'ideas'],
  }

  return {
    state,
    async run(model: string, inputs: Record<string, unknown>) {
      state.calls.push({ model, inputs })
      const messages = inputs.messages as Array<{ role: string; content: string }> | undefined
      const systemPrompt = messages?.[0]?.content ?? ''

      if (String(systemPrompt).includes('JSON のみ')) {
        if (options?.tagsError) {
          throw new Error(options.tagsError)
        }
        return { tags: state.tags }
      }

      if (options?.summaryError) {
        throw new Error(options.summaryError)
      }

      return { summary: state.summary }
    },
  } as never
}

export const createMockEnv = async (options: MockEnvOptions = {}): Promise<MockEnv> => {
  return {
    DB: createMockD1(options.db),
    JOURNAL_BUCKET: await createMockR2Bucket(options.r2),
    AI_QUEUE: createMockQueue(),
    AI: createMockAi(options.ai),
    ACCESS_LOGOUT_URL: options.ACCESS_LOGOUT_URL,
  }
}
