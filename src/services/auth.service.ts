import prisma from '~/libs/prisma/init'
import { compareHashedPassword, createJWT } from '~/middlewares/auth'
import session from 'express-session'
import { Account, User } from '~/generated/prisma/client'

export class AuthService {
  private static instance: AuthService
  private constructor() {}

  static getInstance() {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async createNewUser(data: {
    roleId: number
    username: string
    password: string
    email: string
    firstname: string
    lastname: string
    walletAddress?: string
    walletMnemonic?: string
    phoneNumber?: string
  }) {
    // Check if the account already exists
    const emailExistingAccount = await prisma.account.findUnique({
      where: {
        email: data.email
      }
    })
    const usernameExistingAccount = await prisma.account.findUnique({
      where: {
        username: data.username
      }
    })
    if (usernameExistingAccount) {
      throw new Error('Username is required')
    }
    if (emailExistingAccount) {
      throw new Error('Email already exists')
    }

    // Use a transaction to ensure both operations succeed or both fail
    const [account, user] = await prisma.$transaction(async (tx) => {
      // Create account first to get its ID
      const createdAccount = await tx.account.create({
        data: {
          roleId: data.roleId,
          username: data.username,
          password: data.password,
          email: data.email,
          firstname: data.firstname,
          lastname: data.lastname,
          walletAddress: data.walletAddress,
          walletMnemonic: data.walletMnemonic,
          phoneNumber: data.phoneNumber
        }
      })

      // Then create user with the account ID
      const createdUser = await tx.user.create({
        data: {
          accountId: createdAccount.id,
          firstname: data.firstname,
          lastname: data.lastname,
          phoneNumber: data.phoneNumber
        }
      })

      return [createdAccount, createdUser]
    })

    return { account, user }
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
