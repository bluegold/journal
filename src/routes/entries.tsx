import { Hono } from 'hono'
import { registerEntriesReadRoutes } from './entries.read'
import { registerEntriesWriteRoutes } from './entries.write'
import type { Bindings } from '../types/bindings'
import type { JournalContextVariables } from '../types/journal'

export const entriesRoutes = new Hono<{ Bindings: Bindings; Variables: JournalContextVariables }>()

registerEntriesReadRoutes(entriesRoutes)
registerEntriesWriteRoutes(entriesRoutes)

