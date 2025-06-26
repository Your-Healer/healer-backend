import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import config from './configs/env'
import initRedis from './databases/redis/index'
import initializeRoutes from './routes'
import configMiddleware from './configs/middleware'
import helmet from 'helmet'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import session from 'express-session'
import cors from 'cors'
import { apiLimiter } from './middlewares/validation/rateLimiter'

const sessionMiddleware = session({
  secret: config.secrets.secretKey,
  resave: false,
  // store:
  saveUninitialized: false
})

const PORT = config.port

const app = express()

const redisClient = initRedis()

app.use(sessionMiddleware)
app.use(cors())

app.use(
  helmet({
    crossOriginOpenerPolicy: false,
    originAgentCluster: false
  })
)

if (process.env.NODE_ENV !== 'development' && process.env.USE_STRICT_HEADERS === 'true') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Only set these headers if accessing via HTTPS or localhost
    const protocol = req.get('X-Forwarded-Proto') || req.protocol
    const host = req.get('host') || ''

    if (protocol === 'https' || host.includes('localhost')) {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
      res.setHeader('Origin-Agent-Cluster', '?1')
    }
    next()
  })
}
app.use(morgan('combined'))
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true }))
// app.use(apiLimiter)

initializeRoutes(app)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
