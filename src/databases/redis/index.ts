import Redis from 'ioredis'
import config from '~/configs/env'
import { logger } from '~/configs/logger'

const initRedis = () => {
  const redis = new Redis({
    port: config.secrets.redis.port,
    host: config.secrets.redis.host,
    username: config.secrets.redis.username,
    password: config.secrets.redis.password
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
