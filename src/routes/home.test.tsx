import { describe, expect, it } from 'vitest'
import { requestApp } from '../test-support'
import { createEntryRow } from '../test-support'
import { createUserRow } from '../test-support/fixtures'
import { uiText } from '../lib/i18n'

describe('home route', () => {
  const text = uiText.ja

  it('renders the landing page', async () => {
    const { response, body } = await requestApp('/')

    expect(response.status).toBe(200)
    expect(body).toContain('<html lang="ja"')
    expect(body).toContain('href="/favicon.png"')
    expect(body).toContain('src="/favicon.png"')
    expect(body).toContain('src="/markdown-editor.mjs"')
    expect(body).toContain('href="/"')
    expect(body).toContain('hx-target="#journal-workspace"')
    expect(body).toContain('htmx:afterSwap')
    expect(body).toContain('Tester')
    expect(body).toContain('tester@example.com')
    expect(body).toContain('Calendar')
    expect(body).toContain('Content area')
    expect(body).toContain(text.detail.noEntryTitle)
    expect(body).toContain('popovertarget="journal-user-menu"')
    expect(body).toContain('disabled=""')
  })

  it('shows the logout button when the access logout url is configured', async () => {
    const { response, body } = await requestApp('/', {
      ACCESS_LOGOUT_URL: 'https://example.com/logout',
    })

    expect(response.status).toBe(200)
    expect(body).toContain('href="https://example.com/logout"')
    expect(body).toContain(text.nav.logout)
    expect(body).toContain('tester@example.com')
  })

  it('shows entry markers on the initial calendar', async () => {
    const { response, body } = await requestApp('/', {
      db: {
        initialUsers: [createUserRow()],
        initialEntries: [
          createEntryRow({
            journal_date: '2026-04-22',
            title: 'Initial marker',
          }),
        ],
      },
    })

    expect(response.status).toBe(200)
    expect(body).toContain('data-date="2026-04-22"')
    expect(body).toContain('h-1.5 w-1.5 rounded-full bg-cyan-300')
    expect(body).toContain('2026年4月')
  })

  it('falls back to the default avatar image when Access avatar is missing', async () => {
    const { response, body } = await requestApp('/', {
      init: {
        headers: {
          'cf-access-authenticated-user-avatar': '',
        },
      },
    })

    expect(response.status).toBe(200)
    expect(body).toContain('src="/unknown_avatar.png"')
  })

  it('rejects requests without a Cloudflare Access email header', async () => {
    const { response, body } = await requestApp('/', {
      init: {
        headers: {
          'cf-access-authenticated-user-email': '',
        },
      },
    })

    expect(response.status).toBe(401)
    expect(body).toContain('Cloudflare Access authentication is required.')
  })
})
