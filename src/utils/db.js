const mongoose = require('mongoose')

let mem

async function connectDb() {
  const uri = process.env.MONGODB_URI
  const isProd = process.env.NODE_ENV === 'production'

  if (!uri && isProd) {
    const err = new Error('Missing MONGODB_URI in environment')
    err.status = 500
    throw err
  }

  if (uri) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
      return
    } catch (err) {
      if (isProd) throw err
      // eslint-disable-next-line no-console
      console.warn('MongoDB connect failed; starting in-memory MongoDB for dev.')
    }
  }

  // Dev fallback: in-memory MongoDB
  // Lazy-require so prod builds don't need this.
  // eslint-disable-next-line global-require
  const { MongoMemoryServer } = require('mongodb-memory-server')
  mem = await MongoMemoryServer.create()
  await mongoose.connect(mem.getUri(), { dbName: 'ikiguzi' })
}

module.exports = { connectDb }

