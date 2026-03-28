function badRequest(message) {
  const err = new Error(message || 'Bad request')
  err.status = 400
  err.publicMessage = message || 'Bad request'
  return err
}

function unauthorized(message) {
  const err = new Error(message || 'Unauthorized')
  err.status = 401
  err.publicMessage = message || 'Unauthorized'
  return err
}

module.exports = { badRequest, unauthorized }

