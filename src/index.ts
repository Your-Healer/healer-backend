import 'dotenv/config'
import express from 'express'
import config from './configs/env'
import initRedis from './databases/redis'
import initializeRoutes from './routes'
import configMiddleware from './configs/middleware'

const PORT = config.port
const app = express()

const redisClient = initRedis()

configMiddleware(app)
initializeRoutes(app)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
