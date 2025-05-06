import { merge } from 'lodash'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const stage = process.env.STAGE || 'local'

let envConfig

if (stage === 'production') {
  envConfig = require('./prod').default
} else {
  envConfig = require('./local').default
}

export default merge(
  {
    stage,
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    secrets: {
      db: process.env.DATABASE_URL,
      secretKey: process.env.SECRET,
      redisUsername: process.env.REDIS_USERNAME,
      redisPassword: process.env.REDIS_PASSWORD,
      redisHost: process.env.REDIS_HOST,
      redisPort: process.env.REDIS_PORT
    }
  },
  envConfig
)
