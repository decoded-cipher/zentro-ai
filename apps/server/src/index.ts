import { Hono } from 'hono'

import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { trimTrailingSlash } from 'hono/trailing-slash'

import { clerkAuthMiddleware, authMiddleware } from './middleware'
import apiRouter from './routes'

const app = new Hono()



// Middlewares
app.use('*', cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

app.use('*', logger())
app.use('*', requestId())
app.use('*', secureHeaders())
app.use('*', trimTrailingSlash())


// Health check endpoint
app.get('/', (c) => c.json({
  status: 'ok',
  message: 'API is working properly',
  timestamp: new Date().toISOString(),
}, 200))


// API routes under /api/v1
app.use('/api/v1', clerkAuthMiddleware)
app.use('/api/v1', authMiddleware)
app.route('/api/v1', apiRouter)


// 404 Not Found handler
app.notFound((c) => c.json({
  message: 'API endpoint not found',
}, 404))


export default app
