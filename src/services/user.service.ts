import prisma from '~/libs/prisma/init'

export class UserService {
  private static instance: UserService
  private constructor() {}

  static getInstance() {
    if (!UserService.instance) {
      UserService.instance = new UserService()
    }
    return UserService.instance
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
}
