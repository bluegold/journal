import { Hono } from 'hono'
import { currentUserMiddleware } from './middleware/current-user'
import { apiTokenUserMiddleware } from './middleware/api-token-user'
import { renderer } from './renderer'
import { handleAiSummaryQueueBatch, type AiSummaryQueueMessage } from './lib/ai-summary'
import { entriesRoutes } from './routes/entries'
import { homeRoutes } from './routes/home'
import { searchRoutes } from './routes/search'
import { tagsRoutes } from './routes/tags'
import { apiRoutes } from './routes/api'
import { apiTokenRoutes } from './routes/api-tokens'
import type { Bindings } from './types/bindings'
import type { JournalApiContextVariables, JournalContextVariables } from './types/journal'

const app = new Hono<{ Bindings: Bindings }>()
const webApp = new Hono<{ Bindings: Bindings; Variables: JournalContextVariables }>()
const apiApp = new Hono<{ Bindings: Bindings; Variables: JournalApiContextVariables }>()

webApp.use('*', renderer)
webApp.use('*', currentUserMiddleware)
webApp.route('/', homeRoutes)
webApp.route('/', entriesRoutes)
webApp.route('/', searchRoutes)
webApp.route('/', tagsRoutes)
webApp.route('/', apiTokenRoutes)

apiApp.use('*', apiTokenUserMiddleware)
apiApp.route('/', apiRoutes)

app.route('/api', apiApp)
app.route('/', webApp)

type JournalWorker = ExportedHandler<Bindings, AiSummaryQueueMessage> & {
  request: typeof app.request
}

const worker: JournalWorker = {
  request: app.request.bind(app),
  fetch: (request, env, ctx) => app.fetch(request, env, ctx),
  queue: async (batch, env, ctx) => {
    console.log('AI summary queue batch received', {
      messageCount: batch.messages.length,
    })

    await handleAiSummaryQueueBatch(batch, env, ctx)
  },
}

export default worker
