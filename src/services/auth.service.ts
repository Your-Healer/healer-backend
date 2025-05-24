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

    // Check if the account belongs to a user or staff
    const user = await prisma.user.findUnique({
      where: { accountId: data.account.id }
    })

    const staff = await prisma.staff.findUnique({
      where: { accountId: data.account.id }
    })

    if (!user || !staff) {
      throw new Error('Account not associated with any user or staff')
    }

    const id = user ? user.id : staff.id
    const token = createJWT({
      userName: data.account.username,
      accountId: data.account.id,
      id: id,
      verified: data.account.emailIsVerified,
      isStaff: !!staff
    })

    return {
      token,
      email: data.account.email,
      emailIsVerified: data.account.emailIsVerified,
      name: data.account.firstname + ' ' + data.account.lastname,
      isStaff: !!staff
    }
  }
}
