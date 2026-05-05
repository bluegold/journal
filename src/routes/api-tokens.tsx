import { Hono } from 'hono'
import { createApiToken, deleteApiToken, loadUserApiTokens } from '../lib/api-tokens'
import { ApiTokensPage } from '../templates/pages/api-tokens-page'
import { uiText } from '../lib/i18n'
import type { Bindings } from '../types/bindings'
import type { JournalContextVariables } from '../types/journal'

export const apiTokenRoutes = new Hono<{ Bindings: Bindings; Variables: JournalContextVariables }>()

apiTokenRoutes.get('/settings/api-tokens', async (c) => {
  const apiTokens = await loadUserApiTokens(c.env.DB, c.var.currentUser.id)
  return c.render(
    <ApiTokensPage currentUser={c.var.currentUser} apiTokens={apiTokens} journalConfig={c.var.journalConfig} />
  )
})

apiTokenRoutes.post('/settings/api-tokens', async (c) => {
  const form = await c.req.parseBody()
  const name = typeof form.name === 'string' ? form.name.trim() : ''
  const apiTokens = await loadUserApiTokens(c.env.DB, c.var.currentUser.id)

  if (name.length === 0) {
    c.status(400)
    return c.render(
      <ApiTokensPage
        currentUser={c.var.currentUser}
        apiTokens={apiTokens}
        journalConfig={c.var.journalConfig}
        errorMessage={uiText.ja.apiTokens.errors.nameRequired}
      />
    )
  }

  const { plaintextToken } = await createApiToken({
    db: c.env.DB,
    userId: c.var.currentUser.id,
    name,
  })
  const nextApiTokens = await loadUserApiTokens(c.env.DB, c.var.currentUser.id)
  c.status(201)
  return c.render(
    <ApiTokensPage
      currentUser={c.var.currentUser}
      apiTokens={nextApiTokens}
      journalConfig={c.var.journalConfig}
      createdToken={plaintextToken}
      createdTokenName={name}
    />
  )
})

apiTokenRoutes.post('/settings/api-tokens/:id/delete', async (c) => {
  const deleted = await deleteApiToken({
    db: c.env.DB,
    userId: c.var.currentUser.id,
    tokenId: c.req.param('id'),
  })

  if (!deleted) {
    return c.text('API token not found.', 404)
  }

  return c.redirect('/settings/api-tokens', 303)
})
