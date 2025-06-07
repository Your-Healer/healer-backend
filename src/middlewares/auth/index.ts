import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import prisma from '~/libs/prisma/init'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const SALT_ROUNDS = 10

export const createHashedPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

export const compareHashedPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

export const createJWT = (payload: any): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export const verifyJWT = (token: string): any => {
  return jwt.verify(token, JWT_SECRET)
}

export const protect = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access token is required' })
    }

    const token = authHeader.substring(7)
    const decoded = verifyJWT(token)

    // Get account with role information
    const account = await prisma.account.findUnique({
      where: { id: decoded.accountId },
      include: {
        role: true,
        user: true,
        staff: {
          include: {
            positions: {
              include: {
                position: true
              }
            }
          }
        }
      }
    })

    if (!account) {
      return res.status(401).json({ message: 'Invalid token' })
    }

    req.user = {
      accountId: account.id,
      userId: account.user?.id,
      staffId: account.staff?.id,
      role: account.role?.name,
      username: account.username,
      email: account.email,
      account: account
    }

    next()
  } catch (error: any) {
    console.error('Auth middleware error:', error)
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' })
    }
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const optionalAuth = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      req.user = null
      return next()
    }

    const token = authHeader.substring(7)
    const decoded = verifyJWT(token)

    const account = await prisma.account.findUnique({
      where: { id: decoded.accountId },
      include: {
        role: true,
        user: true,
        staff: {
          include: {
            positions: {
              include: {
                position: true
              }
            }
          }
        }
      }
    })

    if (account) {
      req.user = {
        accountId: account.id,
        userId: account.user?.id,
        staffId: account.staff?.id,
        role: account.role?.name,
        username: account.username,
        email: account.email,
        account: account
      }
    } else {
      req.user = null
    }

    next()
  } catch (error: any) {
    // If token is invalid, continue without authentication
    req.user = null
    next()
  }
}
