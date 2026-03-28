const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')

const { authRouter } = require('./routes/auth')
const { cropsRouter } = require('./routes/crops')
const { costsRouter } = require('./routes/costs')
const { predictionsRouter } = require('./routes/predictions')
const { alertsRouter } = require('./routes/alerts')
const { reportsRouter } = require('./routes/reports')

function createApp() {
  const app = express()
  app.use(cors())

  app.use(helmet())
  const allowedOrigins = (
    process.env.CLIENT_ORIGIN ||
    'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  // app.use(
  //   cors({
  //     origin(origin, cb) {
  //       if (!origin) return cb(null, true) // same-origin / server-to-server
  //       if (allowedOrigins.includes(origin)) return cb(null, true)
  //       return cb(new Error(`CORS blocked origin: ${origin}`))
  //     },
  //     credentials: false,
  //   }),
  // )

  app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true)

      if (allowedOrigins.includes(origin)) {
        return cb(null, true)
      }

      // instead of throwing error → just reject silently
      return cb(null, false)
    },
    credentials: false,
  })
)
  app.use(express.json({ limit: '1mb' }))
  app.use(morgan('dev'))

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use('/api/auth', authRouter)
  app.use('/api/crops', cropsRouter)
  app.use('/api/costs', costsRouter)
  app.use('/api/predictions', predictionsRouter)
  app.use('/api/alerts', alertsRouter)
  app.use('/api/reports', reportsRouter)

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = Number(err.status || 500)
    res.status(status).json({
      error: err.publicMessage || 'Server error',
    })
  })

  return app
}

module.exports = { createApp }

