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
      redis: {
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      },
      substrateHost: process.env.SUBSTRATE_HOST,
      supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_API_KEY
      },
      vnpay: {
        tmncode: process.env.VN_PAY_TMNCODE,
        secureSecret: process.env.VN_PAY_SECURE_SECRET,
        host: process.env.VN_PAY_HOST,
        testMode: process.env.VN_PAY_TEST_MODE == 'true'
      },
      zalopay: {},
      mail: {
        apiKey: process.env.MAIL_GUN_API_KEY
      }
    }
  },
  envConfig
)
