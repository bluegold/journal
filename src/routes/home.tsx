import { Hono } from 'hono'
import type { Bindings } from '../types/bindings'

export const homeRoutes = new Hono<{ Bindings: Bindings }>()

homeRoutes.get('/', (c) => {
  return c.render(
    <div class="space-y-4">
      <h1 class="text-2xl font-semibold">Journal</h1>
      <div class="card">
        <div class="card-body space-y-3">
          <p>Bootstrap 完了。</p>
          <a class="btn btn-primary" href="/entries">
            Entries
          </a>
        </div>
      </div>
    </div>
  )
})
