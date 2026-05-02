import { Hono } from 'hono'
import { currentUserMiddleware } from './middleware/current-user'
import { renderer } from './renderer'
import { handleAiSummaryQueueBatch, type AiSummaryQueueMessage } from './lib/ai-summary'
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
