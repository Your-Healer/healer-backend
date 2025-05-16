import prisma from '~/libs/prisma/init'

export default class StaffService {
  private static instance: StaffService
  private constructor() {}

  static getInstance() {
    if (!StaffService.instance) {
      StaffService.instance = new StaffService()
    }
    return StaffService.instance
  }

  async createNewStaff({
    roleId,
    username,
    password,
    email,
    firstname,
    lastname,
    walletAddress,
    walletMnemonic,
    phoneNumber,
    positionIds,
    departmentIds
  }: {
    roleId: number
    username: string
    password: string
    email: string
    firstname: string
    lastname: string
    walletAddress?: string
    walletMnemonic?: string
    phoneNumber: string
    positionIds: Array<number>
    departmentIds: Array<number>
  }) {
    // Check if the account already exists
    const emailExistingAccount = await prisma.account.findUnique({
      where: {
        email
      }
    })
    const usernameExistingAccount = await prisma.account.findUnique({
      where: {
        username
      }
    })
    const phoneNumberExistingAccount = await prisma.account.findUnique({
      where: {
        phoneNumber
      }
    })
    if (usernameExistingAccount) {
      throw new Error('Username is required')
    }
    if (emailExistingAccount) {
      throw new Error('Email already exists')
    }
    if (phoneNumber) {
      if (phoneNumberExistingAccount) {
        throw new Error('Phone number already exists')
      }
    }

    // Use a transaction to ensure both operations succeed or both fail
    const [account, staff] = await prisma.$transaction(async (tx) => {
      // Create account first to get its ID
      const createdAccount = await tx.account.create({
        data: {
          roleId,
          username,
          password,
          email,
          firstname,
          lastname,
          walletAddress,
          walletMnemonic,
          phoneNumber
        }
      })

      const positions = positionIds.map((positionId) => ({
        positionId,
        createdAt: new Date()
      }))
      const departments = departmentIds.map((departmentId) => ({
        departmentId,
        createdAt: new Date()
      }))

      const createdStaff = await tx.staff.create({
        data: {
          accountId: createdAccount.id,
          positions: {
            create: positions
          },
          departments: {
            create: departments
          },
          firstname,
          lastname,
          phoneNumber
        }
      })

      return [createdAccount, createdStaff]
    })

    return { account, staff }
  }

  async getAllStaffPagination({
    page = 1,
    limit = 10,
    search = '',
    positionIds = [],
    departmentIds = []
  }: {
    page?: number
    limit?: number
    search?: string
    positionIds?: Array<number>
    departmentIds?: Array<number>
  }) {
    const offset = (page - 1) * limit

    const staffs = await prisma.staff.findMany({
      skip: offset,
      take: limit,
      where: {
        AND: [
          {
            OR: [
              { firstname: { contains: search, mode: 'insensitive' } },
              { lastname: { contains: search, mode: 'insensitive' } },
              { phoneNumber: { contains: search, mode: 'insensitive' } }
            ]
          },
          positionIds.length
            ? {
                positions: {
                  some: {
                    positionId: { in: positionIds }
                  }
                }
              }
            : {},
          departmentIds.length
            ? {
                departments: {
                  some: {
                    departmentId: { in: departmentIds }
                  }
                }
              }
            : {}
        ]
      },
      include: {
        account: true,
        positions: true,
        departments: true
      }
    })

    return {
      total: staffs.length,
      staffs
    }
  }
}
