import Redis from 'ioredis'
import { logger } from '../configs/logger'

const initRedis = () => {
  let client: Redis

  // Check if REDIS_URL is provided
  if (process.env.REDIS_URL) {
    client = new Redis(process.env.REDIS_URL)
    logger.info('Redis client initialized using REDIS_URL')
  } else {
    // Otherwise use individual credentials
    client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD
    })
  }

  client.on('connect', () => {
    logger.info('Redis client connected')
  })

  client.on('error', (err) => {
    logger.error('Redis client error:', err)
  })

  return client
}

export default initRedis
