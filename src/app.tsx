import { Hono } from 'hono'
import { renderer } from './renderer'
import { entriesRoutes } from './routes/entries'
import { homeRoutes } from './routes/home'
import { searchRoutes } from './routes/search'
import type { Bindings } from './types/bindings'

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', renderer)
app.route('/', homeRoutes)
app.route('/', entriesRoutes)
app.route('/', searchRoutes)

export default app
