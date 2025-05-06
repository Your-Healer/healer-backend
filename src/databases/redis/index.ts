import Redis from 'ioredis'
import config from '~/configs/env'
import { logger } from '~/configs/logger'

const initRedis = () => {
  const redis = new Redis({
    port: config.secrets.redisPort,
    host: config.secrets.redisHost,
    username: config.secrets.redisUsername,
    password: config.secrets.redisPassword
  })

  redis.on('ready', () => {
    logger.info('Redis is ready')
  })

  redis.on('connect', () => {
    logger.info('Redis connected')
  })

  redis.on('error', (err) => {
    logger.error('Redis error: ', err)
  })

  redis.on('end', () => {
    logger.info('Redis connection closed')
  })

  redis.on('reconnecting', () => {
    logger.info('Redis reconnecting')
  })

  return redis
}

export default initRedis
