import express, { Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import { apiLimiter } from '../../middlewares/validation/rateLimiter'
import config from '../../configs/env'
import session from 'express-session'
import cors from 'cors'

const sessionMiddleware = session({
  secret: config.secrets.secretKey,
  resave: false,
  // store:
  saveUninitialized: false
})

const PORT = config.port

const configMiddleware = (app: any) => {
  app.use(sessionMiddleware)

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || [`http://localhost:${PORT}`].includes(origin)) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'))
        }
      },
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
    })
  )

  app.use(helmet())

  if (process.env.NODE_ENV !== 'development') {
    app.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
      res.setHeader('Origin-Agent-Cluster', '?1')
      next()
    })
  }
  app.use(morgan('combined'))
  app.use(bodyParser.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(apiLimiter)
}

export default configMiddleware
