# Environment Variables

This app runs on Cloudflare Workers and reads its runtime configuration from bindings and development-only variables.

## Required bindings

- `DB`
  - D1 database for normalized metadata.
- `JOURNAL_BUCKET`
  - R2 bucket for markdown bodies and uploaded assets.
- `AI_QUEUE`
  - Queue used to enqueue asynchronous AI enrichment work.
- `AI`
  - Cloudflare AI binding used by the queue consumers.

## Optional bindings

- `ACCESS_LOGOUT_URL`
  - Logout URL shown in the header user popover.
  - If set, the popover shows a clickable logout link.
  - If unset, the popover still shows a disabled logout button so the UI can be verified in development.

## Local development variables

When running `wrangler dev`, you can provide Access-style fallback identity values through `.dev.vars`.

- `DEV_ACCESS_USER_EMAIL`
- `DEV_ACCESS_USER_ID`
- `DEV_ACCESS_USER_NAME`
- `DEV_ACCESS_USER_AVATAR`

Notes:

- If Cloudflare Access headers are present, they take precedence over the local dev values.
- The local values are only a development fallback.
- If the local values are configured, the app can auto-create the current user row on the first request.

