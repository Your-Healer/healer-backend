import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { Request, Response, NextFunction } from 'express'
import { logger } from '~/configs/logger'
import prisma from '~/libs/prisma/init'
import { Role } from '~/generated/prisma/client'

export const createHashedPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}

export const compareHashedPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

export const createJWT = (user: {
  id: string
  accountId: string | number
  userName: string
  verified: boolean
  isStaff?: boolean
}): string => {
  const token = jwt.sign(
    {
      id: user.id,
      accountId: user.accountId,
      userName: user.userName,
      verified: user.verified,
      isStaff: user.isStaff || false
    },
    process.env.JWT_SECRET as string
  )
  return token
}

export const createEmailJWT = (email: string): string => {
  const token = jwt.sign(
    {
      email
    },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' }
  )
  return token
}

export const protect = (req: any, res: Response, next: NextFunction): any => {
  const bearerToken = req.headers.authorization

  if (!bearerToken) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  const [, token] = bearerToken.split(' ')

  if (!token) {
    return res.status(401).json({ message: 'Invalid token' })
  }
  try {
    const user = jwt.verify(token, (process.env.JWT_SECRET as string) || ' ')
    req.user = user
    req.token = token
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

export const blockJWT = (req: any, res: Response, next: NextFunction): any => {
  const bearer = req.headers.authorization
  const tokenFromSession = req.session.token
  logger.info('🚀 ~ file: index.ts:68 ~ blockJWT ~ tokenFromSession:', tokenFromSession)
  if (!tokenFromSession) {
    return res.status(401).json({ msg: 'Session Expired' })
  }
  if (!bearer) {
    return res.status(401).json({ msg: 'Unauthorized' })
  }

  const [, token] = bearer.split(' ')

  if (!token) {
    return res.status(401).json({ msg: 'invalid token' })
  }
  if (token !== tokenFromSession) {
    return res.status(401).json({ msg: 'invalid token' })
  }
  next()
}

export const checkVerified = (req: any, res: Response, next: NextFunction): any => {
  const { verified } = req.user
  if (!verified) {
    return res.status(401).json({ message: 'User not verified' })
  }
  next()
}

export const checkRole = (roles: Array<string>) => {
  return async (req: any, res: Response, next: NextFunction): Promise<any> => {
    const { accountId } = req.user
    const account = await prisma.account.findUnique({ where: { id: accountId } })
    if (!account) {
      return res.status(401).send()
    }
    if (roles.indexOf(account.roleId) > -1) next()
    return res.status(401).send()
  }
}
