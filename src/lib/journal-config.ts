import type { Bindings } from '../types/bindings'

export type JournalConfig = {
  logoutHref: string | null
}

export const buildJournalConfig = (env: Pick<Bindings, 'ACCESS_LOGOUT_URL'>): JournalConfig => {
  return {
    logoutHref: env.ACCESS_LOGOUT_URL ?? null,
  }
}
