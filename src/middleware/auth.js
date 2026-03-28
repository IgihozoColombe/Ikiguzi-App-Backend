const jwt = require('jsonwebtoken')
const { unauthorized } = require('../utils/httpErrors')

function requireAuth(req, _res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return next(unauthorized('Missing token'))
  if (!process.env.JWT_SECRET) return next(unauthorized('Server not configured'))

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.sub }
    return next()
  } catch {
    return next(unauthorized('Invalid token'))
  }
}

module.exports = { requireAuth }

