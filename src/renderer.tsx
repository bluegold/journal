import { jsxRenderer } from 'hono/jsx-renderer'
import { AppLayout } from './layouts/app-layout'

export const renderer = jsxRenderer(({ children }) => {
  return <AppLayout title="Journal">{children}</AppLayout>
})
