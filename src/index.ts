import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import session from 'express-session'
import bodyParser from 'body-parser'
import { apiLimiter } from './middlewares/validation/rateLimiter'
import config from './configs/env'
import initRedis from './databases/redis'

const PORT = config.port

const app = express()
export const sessionMiddleware = session({
  secret: config.secrets.jwt,
  resave: false,
  // store:
  saveUninitialized: false
})
const redisClient = initRedis()

app.use(sessionMiddleware)
app.use(cors())
app.use(helmet())
app.use(morgan('combined'))
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true }))
app.use(apiLimiter)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
