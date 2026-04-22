export const isHtmxRequest = (request: Request): boolean => {
  return request.headers.get('HX-Request') === 'true'
}

type WorkspaceLinkOptions = {
  target?: string
  swap?: string
  pushUrl?: boolean
}

export const createWorkspaceLinkAttrs = (href: string, options: WorkspaceLinkOptions = {}) => {
  return {
    href,
    'hx-get': href,
    'hx-target': options.target ?? '#journal-workspace',
    'hx-swap': options.swap ?? 'outerHTML',
    'hx-push-url': options.pushUrl === false ? 'false' : 'true',
  } as const
}
