import { Hono } from 'hono'
import { HomePage } from '../templates/pages/home-page'
import type { Bindings } from '../types/bindings'

export const homeRoutes = new Hono<{ Bindings: Bindings }>()

homeRoutes.get('/', (c) => {
  return c.render(<HomePage />)
})
