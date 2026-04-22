import { describe, expect, it } from 'vitest'
import { createWorkspaceLinkAttrs, isHtmxRequest } from './htmx'

describe('htmx helpers', () => {
  it('detects htmx requests by header', () => {
    expect(isHtmxRequest(new Request('https://example.com', { headers: { 'HX-Request': 'true' } }))).toBe(true)
    expect(isHtmxRequest(new Request('https://example.com'))).toBe(false)
  })

  it('builds workspace link attrs', () => {
    expect(createWorkspaceLinkAttrs('/entries?month=2026-04')).toEqual({
      href: '/entries?month=2026-04',
      'hx-get': '/entries?month=2026-04',
      'hx-target': '#journal-workspace',
      'hx-swap': 'outerHTML',
      'hx-push-url': 'true',
    })
  })
})
