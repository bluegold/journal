export type Bindings = {
  DB: D1Database
  JOURNAL_BUCKET: R2Bucket
  AI_QUEUE: Queue
  AI: Ai
  ACCESS_LOGOUT_URL?: string
  DEV_ACCESS_USER_EMAIL?: string
  DEV_ACCESS_USER_ID?: string
  DEV_ACCESS_USER_NAME?: string
  DEV_ACCESS_USER_AVATAR?: string
}
