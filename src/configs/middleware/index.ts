import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import { apiLimiter } from '../../middlewares/validation/rateLimiter'
import config from '../../configs/env'
import session from 'express-session'

const sessionMiddleware = session({
  secret: config.secrets.secretKey,
  resave: false,
  // store:
  saveUninitialized: false
})

const configMiddleware = (app: any) => {
  app.use(sessionMiddleware)

  app.use(
    helmet({
      crossOriginOpenerPolicy: false,
      crossOriginEmbedderPolicy: false
    })
  )
  app.use(morgan('combined'))
  app.use(bodyParser.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(apiLimiter)
}

export default configMiddleware
