import { Hono } from 'hono'
import { HomePage } from '../templates/pages/home-page'
import type { Bindings } from '../types/bindings'
import type { JournalContextVariables } from '../types/journal'

export const homeRoutes = new Hono<{ Bindings: Bindings; Variables: JournalContextVariables }>()

homeRoutes.get('/', (c) => {
  return c.render(<HomePage currentUser={c.var.currentUser} />)
})
