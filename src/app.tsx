import { Hono } from 'hono'
import { currentUserMiddleware } from './middleware/current-user'
import { renderer } from './renderer'
import { entriesRoutes } from './routes/entries'
import { homeRoutes } from './routes/home'
import { searchRoutes } from './routes/search'
import { tagsRoutes } from './routes/tags'
import type { Bindings } from './types/bindings'
import type { JournalContextVariables } from './types/journal'

const app = new Hono<{ Bindings: Bindings; Variables: JournalContextVariables }>()

app.use('*', renderer)
app.use('*', currentUserMiddleware)
app.route('/', homeRoutes)
app.route('/', entriesRoutes)
app.route('/', searchRoutes)
app.route('/', tagsRoutes)

export default app
