import { Account } from '@prisma/client'
import BaseService from './base.service'
import { compareHashedPassword, createJWT } from '~/middlewares/auth/index'
import prisma from '~/libs/prisma/init'
import { LoginDTO, LoginResponse } from '~/dtos/auth.dto'

export default class AuthService extends BaseService {
  private static instance: AuthService

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(data: LoginDTO): Promise<LoginResponse> {
    try {
      let account
      switch (data.type) {
        case 'username':
          account = await prisma.account.findUnique({
            where: { username: data.identifier },
            select: {
              id: true,
              role: {
                select: {
                  id: true,
                  name: true
                }
              },
              avatar: true,
              password: true,
              emailIsVerified: true
            }
          })
          break
        case 'email':
          account = await prisma.account.findUnique({
            where: { email: data.identifier },
            select: {
              id: true,
              role: {
                select: {
                  id: true,
                  name: true
                }
              },
              avatar: true,
              password: true,
              emailIsVerified: true
            }
          })
          break
        case 'phone':
          account = await prisma.account.findFirst({
            where: { phoneNumber: data.identifier },
            select: {
              id: true,
              role: {
                select: {
                  id: true,
                  name: true
                }
              },
              password: true,
              emailIsVerified: true
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
      const isPasswordValid = await compareHashedPassword(data.password, account.password)
      if (!isPasswordValid) {
        throw new Error('Invalid credentials')
      }

      // Check if account belongs to user or staff
      const [user, staff] = await Promise.all([
        prisma.user.findUnique({
          where: { accountId: account.id },
          select: {
            id: true,
            firstname: true,
            lastname: true
          }
        }),
        prisma.staff.findUnique({
          where: { accountId: account.id },
          select: {
            id: true,
            firstname: true,
            lastname: true,
            positions: {
              select: {
                positionId: true
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
        role: account.role?.name,
        positions: staff?.positions.map((p) => p.positionId) || []
      }

      const token = createJWT(tokenPayload)

      const { password: _, ...accountWithoutPassword } = account

      return {
        token,
        staff: staff || undefined,
        user: user || undefined,
        account: accountWithoutPassword
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
