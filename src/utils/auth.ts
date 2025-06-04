import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import config from '~/configs/env'

export const generateRandomToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex')
}

export const generateVerificationToken = (): string => {
  return generateRandomToken(16)
}

export const generatePasswordResetToken = (): string => {
  return generateRandomToken(32)
}

export const createEmailVerificationToken = (accountId: string): string => {
  return jwt.sign({ accountId, type: 'email_verification' }, config.secrets.secretKey, { expiresIn: '24h' })
}

export const createPasswordResetToken = (accountId: string): string => {
  return jwt.sign({ accountId, type: 'password_reset' }, config.secrets.secretKey, { expiresIn: '1h' })
}

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, config.secrets.secretKey)
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

export const sanitizeAccountResponse = (account: any) => {
  const { password, walletMnemonic, ...sanitizedAccount } = account
  return sanitizedAccount
}

export const generateUsername = (email: string): string => {
  const baseUsername = email.split('@')[0].toLowerCase()
  const randomSuffix = Math.floor(Math.random() * 1000)
  return `${baseUsername}${randomSuffix}`
}
