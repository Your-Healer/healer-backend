import prisma from '~/libs/prisma/init'
import { Account, Appointment, User } from '@prisma/client'

export default class UserService {
  private static instance: UserService
  private constructor() {}

  static getInstance() {
    if (!UserService.instance) {
      UserService.instance = new UserService()
    }
    return UserService.instance
  }

  async createNewUser(data: {
    roleId: string
    username: string
    password: string
    email: string
    firstname: string
    lastname: string
    walletAddress: string
    walletMnemonic: string
    phoneNumber?: string
    address?: string
  }): Promise<{ account: Account; user: User }> {
    const {
      roleId,
      username,
      password,
      email,
      firstname,
      lastname,
      walletAddress,
      walletMnemonic,
      phoneNumber,
      address
    } = data

    const account = await prisma.account.create({
      data: {
        roleId,
        username,
        password,
        email,
        firstname,
        lastname,
        walletAddress,
        walletMnemonic,
        phoneNumber,
        emailIsVerified: false
      }
    })

    const user = await prisma.user.create({
      data: {
        accountId: account.id,
        firstname,
        lastname,
        phoneNumber,
        address
      }
    })

    return { account, user }
  }

  async getUserById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id }
    })
  }

  async getUserByAccountId(accountId: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { accountId }
    })
  }

  async getAppointmentsHistory(userId: string): Promise<Appointment[]> {
    return await prisma.appointment.findMany({
      where: { userId },
      include: {
        medicalRoom: {
          include: {
            service: true,
            department: true
          }
        },
        bookingTime: true
      },
      orderBy: {
        bookingTime: {
          medicalRoomTime: {
            fromTime: 'desc'
          }
        }
      }
    })
  }

  // async getUserDiseases(userId: string) {
  //   return prisma.userDisease.findMany({
  //     where: { userId },
  //     include: {
  //       disease: true
  //     },
  //     orderBy: {
  //       diagnosedAt: 'desc'
  //     }
  //   })
  // }
}
