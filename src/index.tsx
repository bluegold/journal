import { Hono } from 'hono'
import { renderer } from './renderer'
import type { Bindings } from './types/bindings'

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', renderer)

app.get('/', (c) => {
  return c.render(
    <div class="space-y-4">
      <h1 class="text-2xl font-semibold">Journal</h1>
      <div class="card">
        <div class="card-body space-y-3">
          <p>Bootstrap 完了。</p>
          <a class="btn btn-primary" href="/entries">Entries</a>
        </div>
      </div>
    </div>
  )
})

app.get('/entries', (c) => {
  return c.render(
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold">Entries</h1>
        <a class="btn" href="/entries/new">New</a>
      </div>

      <form hx-get="/search" hx-target="#search-results" class="space-y-2">
        <input
          class="input w-full"
          type="search"
          name="q"
          placeholder="title / tags / summary"
        />
      </form>

      <div id="search-results" class="space-y-3"></div>
    </div>
  )
})

app.get('/search', (c) => {
  const q = c.req.query('q') ?? ''
  return c.html(<div class="text-sm opacity-70">search: {q}</div>)
})

export default app
