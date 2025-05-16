import prisma from '~/libs/prisma/init'
import { compareHashedPassword, createJWT } from '~/middlewares/auth'
import { Account } from '~/generated/prisma/client'

export class AuthService {
  private static instance: AuthService
  private constructor() {}

  static getInstance() {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(data: { account: Account; password: string }) {
    const isPasswordValid = await compareHashedPassword(data.password, data.account.password)
    if (!isPasswordValid) {
      throw new Error('Invalid password')
    }
    const user = await prisma.user.findUnique({
      where: { accountId: data.account.id }
    })
    if (!user) {
      throw new Error('User not found')
    }

    const token = createJWT({
      userName: data.account.username,
      accountId: data.account.id,
      id: user.id,
      verified: data.account.emailIsVerified
    })
    return {
      token,
      email: data.account.email,
      emailIsVerified: data.account.emailIsVerified,
      name: data.account.firstname + ' ' + data.account.lastname
    }
  }
}
