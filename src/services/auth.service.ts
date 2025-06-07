import { Account } from '@prisma/client'
import BaseService from './base.service'
import { compareHashedPassword, createJWT } from '~/middlewares/auth/index'
import prisma from '~/libs/prisma/init'

export interface LoginDTO {
  identifier: string // username, email, or phone
  password: string
  type: 'username' | 'email' | 'phone'
}

export interface LoginResponse {
  token: string
  user?: any
  staff?: any
  account: Account
}

export default class AuthService extends BaseService {
  private static instance: AuthService

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(identifier: string, password: string, type: 'username' | 'email' | 'phone'): Promise<LoginResponse> {
    try {
      // Find account based on login type
      let account
      switch (type) {
        case 'username':
          account = await prisma.account.findUnique({
            where: { username: identifier },
            include: {
              role: true,
              avatar: true
            }
          })
          break
        case 'email':
          account = await prisma.account.findUnique({
            where: { email: identifier },
            include: {
              role: true,
              avatar: true
            }
          })
          break
        case 'phone':
          account = await prisma.account.findFirst({
            where: { phoneNumber: identifier },
            include: {
              role: true,
              avatar: true
            }
          })
          break
        default:
          throw new Error('Invalid login type')
      }

      if (!account) {
        throw new Error('Invalid credentials')
      }

      // Verify password
      const isPasswordValid = await compareHashedPassword(password, account.password)
      if (!isPasswordValid) {
        throw new Error('Invalid credentials')
      }

      // Check if account belongs to user or staff
      const [user, staff] = await Promise.all([
        prisma.user.findUnique({
          where: { accountId: account.id },
          include: {
            Patient: true
          }
        }),
        prisma.staff.findUnique({
          where: { accountId: account.id },
          include: {
            positions: {
              include: {
                position: true
              }
            },
            departments: {
              include: {
                department: true
              }
            }
          }
        })
      ])

      // Generate JWT token
      const tokenPayload = {
        accountId: account.id,
        userId: user?.id,
        staffId: staff?.id,
        role: account.role?.name
      }

      const token = createJWT(tokenPayload)

      // Update last login (if you have this field)
      // await prisma.account.update({
      //   where: { id: account.id },
      //   data: { lastLogin: new Date() }
      // })

      return {
        token,
        user,
        staff,
        account
      }
    } catch (error) {
      this.handleError(error, 'AuthService.login')
    }
  }

  async validateToken(token: string): Promise<any> {
    try {
      // This would be implemented with your JWT validation logic
      // const decoded = jwt.verify(token, process.env.JWT_SECRET)
      // return decoded
      return null
    } catch (error) {
      this.handleError(error, 'AuthService.validateToken')
    }
  }

  async refreshToken(oldToken: string): Promise<string> {
    try {
      // Validate old token and generate new one
      const decoded = await this.validateToken(oldToken)
      if (!decoded) {
        throw new Error('Invalid token')
      }

      const newToken = createJWT({
        accountId: decoded.accountId,
        userId: decoded.userId,
        staffId: decoded.staffId,
        role: decoded.role
      })

      return newToken
    } catch (error) {
      this.handleError(error, 'AuthService.refreshToken')
    }
  }

  async verifyEmail(token: string): Promise<boolean> {
    try {
      // Implement email verification logic
      // This would typically involve validating a verification token
      // and updating the account's emailIsVerified field
      return true
    } catch (error) {
      this.handleError(error, 'AuthService.verifyEmail')
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      const account = await prisma.account.findUnique({
        where: { email }
      })

      if (!account) {
        // Don't reveal if email exists or not for security
        return
      }

      // Generate password reset token and send email
      // Implementation would depend on your email service
    } catch (error) {
      this.handleError(error, 'AuthService.requestPasswordReset')
    }
  }
}
