import 'dotenv/config'
import express from 'express'
import config from './configs/env'
import initRedis from './databases/redis'
import initializeRoutes from './routes'
import configMiddleware from './configs/middleware'
import cors from 'cors'

const PORT = config.port
const app = express()
app.use(
  cors({
    origin: '*', // Or specify allowed origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
)

const redisClient = initRedis()

configMiddleware(app)

initializeRoutes(app)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
