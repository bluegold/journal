import app from '../app'
import { createMockEnv, type MockEnvOptions } from './mock-env'

type RequestAppOptions = MockEnvOptions & {
  init?: RequestInit
}

export const requestApp = async (path: string, options: RequestAppOptions = {}) => {
  const { init, ...envOptions } = options
  const env = await createMockEnv(envOptions)
  const response = await app.request(path, init ?? {}, env)
  const body = await response.text()

  return {
    env,
    response,
    body,
  }
}
