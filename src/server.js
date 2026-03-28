const http = require('http')
const { createApp } = require('./app')
const { connectDb } = require('./utils/db')
require('dotenv').config()

const PORT = Number(process.env.PORT || 4000)

async function main() {
  await connectDb()
  const app = createApp()
  const server = http.createServer(app)
  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Ikiguzi API listening on http://localhost:${PORT}`)
  })
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})

