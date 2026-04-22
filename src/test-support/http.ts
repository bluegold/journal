import app from '../app'
import { createMockEnv, type MockEnvOptions } from './mock-env'

type RequestAppOptions = MockEnvOptions & {
  init?: RequestInit
}

const defaultAccessHeaders: Record<string, string> = {
  'cf-access-authenticated-user-email': 'tester@example.com',
  'cf-access-authenticated-user-id': 'access-subject-1',
  'cf-access-authenticated-user-name': 'Tester',
  'cf-access-authenticated-user-avatar': 'https://example.com/avatar.png',
}

export const requestApp = async (path: string, options: RequestAppOptions = {}) => {
  const { init, ...envOptions } = options
  const env = await createMockEnv(envOptions)
  const headers = new Headers(init?.headers ?? {})

  for (const [key, value] of Object.entries(defaultAccessHeaders)) {
    if (!headers.has(key)) {
      headers.set(key, value)
    }
  }

  const response = await app.request(path, { ...init, headers }, env)
  const body = await response.text()

  return {
    env,
    response,
    body,
  }
}
