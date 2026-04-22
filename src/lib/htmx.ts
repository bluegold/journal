export const isHtmxRequest = (request: Request): boolean => {
  return request.headers.get('HX-Request') === 'true'
}

export const createWorkspaceLinkAttrs = (href: string) => {
  return {
    href,
    'hx-get': href,
    'hx-target': '#journal-workspace',
    'hx-swap': 'outerHTML',
    'hx-push-url': 'true',
  } as const
}
