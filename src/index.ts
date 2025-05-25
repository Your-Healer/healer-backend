// Register module aliases
import './aliases'

import 'dotenv/config'
import express, { Request, Response } from 'express'
import config from './configs/env'
import initRedis from './databases/redis'
import initializeRoutes from './routes'
import configMiddleware from './configs/middleware'

const PORT = config.port
const app = express()

const redisClient = initRedis()

configMiddleware(app)

initializeRoutes(app)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
