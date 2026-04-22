import app from '../app'
import { createMockEnv, type MockEnvOptions } from './mock-env'

export const requestApp = async (path: string, options: MockEnvOptions = {}) => {
  const env = await createMockEnv(options)
  const response = await app.request(path, {}, env)
  const body = await response.text()

  return {
    env,
    response,
    body,
  }
}
