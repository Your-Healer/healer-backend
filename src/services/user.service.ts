import { User, Prisma, APPOINTMENTSTATUS } from '@prisma/client'
import BaseService from './base.service'
import prisma from '~/libs/prisma/init'
import AttachmentService from './attachment.service'

export interface CreateUserData {
  accountId: string
  firstname: string
  lastname: string
  phoneNumber?: string
  address?: string
}

export interface UpdateUserData {
  firstname?: string
  lastname?: string
  phoneNumber?: string
  address?: string
}

export interface UserFilter {
  searchTerm?: string
  hasAppointments?: boolean
  isActive?: boolean
}

export interface UserPreferences {
  language: string
  timezone: string
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
    appointmentReminders: boolean
    promotionalMessages: boolean
  }
  appointmentSettings: {
    defaultDuration: number
    preferredTimeSlots: string[]
    preferredDepartments: string[]
  }
}

export default class UserService extends BaseService {
  private static instance: UserService
  private attachmentService: AttachmentService
  private constructor() {
    super()
    this.attachmentService = AttachmentService.getInstance()
  }
  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService()
    }
    return UserService.instance
  }
  async createUser(data: CreateUserData): Promise<User> {
    try {
      // Validate account exists
      const account = await prisma.account.findUnique({
        where: { id: data.accountId }
      })
      if (!account) {
        throw new Error('Account not found')
      }

      // Check if user already exists for this account
      const existingUser = await prisma.user.findUnique({
        where: { accountId: data.accountId }
      })
      if (existingUser) {
        throw new Error('User already exists for this account')
      }

      // Check phone uniqueness if provided
      if (data.phoneNumber) {
        const phoneExists = await prisma.user.findFirst({
          where: { phoneNumber: data.phoneNumber }
        })
        if (phoneExists) {
          throw new Error('Phone number already exists')
        }
      }

      const userData: Prisma.UserCreateInput = {
        account: { connect: { id: data.accountId } },
        firstname: data.firstname,
        lastname: data.lastname,
        phoneNumber: data.phoneNumber,
        address: data.address
      }

      return await prisma.user.create({
        data: userData
      })
    } catch (error) {
      this.handleError(error, 'createUser')
    }
  }

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { id }
      })
      if (!existingUser) {
        throw new Error('User not found')
      }

      // Check phone uniqueness if updating
      if (data.phoneNumber && data.phoneNumber !== existingUser.phoneNumber) {
        const phoneExists = await prisma.user.findFirst({
          where: { phoneNumber: data.phoneNumber }
        })
        if (phoneExists && phoneExists.id !== id) {
          throw new Error('Phone number already exists')
        }
      }

      const updateData: Prisma.UserUpdateInput = {
        firstname: data.firstname,
        lastname: data.lastname,
        phoneNumber: data.phoneNumber,
        address: data.address
      }

      return await prisma.user.update({
        where: { id },
        data: updateData
      })
    } catch (error) {
      this.handleError(error, 'updateUser')
    }
  }

  async getUserById(id: string) {
    try {
      let user: any = await prisma.user.findUnique({
        where: { id },
        include: {
          account: {
            include: {
              role: true,
              avatar: true
            }
          },
          Patient: {
            include: {
              _count: {
                select: {
                  Appointment: true
                }
              }
            }
          }
        }
      })
      const avatar = user?.account.avatar
        ? await this.attachmentService.getAttachmentById(user.account.avatar.id)
        : null
      if (user && user.account) {
        user.account.avatar = avatar
      }

      return user
    } catch (error) {
      this.handleError(error, 'getUserById')
    }
  }

  async getUserByAccountId(accountId: string) {
    try {
      let user: any = await prisma.user.findUnique({
        where: { accountId },
        include: {
          account: {
            include: {
              role: true,
              avatar: true
            }
          },
          Patient: {
            include: {
              _count: {
                select: {
                  Appointment: true
                }
              }
            }
          }
        }
      })
      const avatar = user?.account.avatar
        ? await this.attachmentService.getAttachmentById(user.account.avatar.id)
        : null
      if (user && user.account) {
        user.account.avatar = avatar
      }

      return user
    } catch (error) {
      this.handleError(error, 'getUserByAccountId')
    }
  }

  async getUsers(filter: UserFilter = {}, page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      const where: any = {}

      if (filter.searchTerm) {
        where.OR = [
          { firstname: { contains: filter.searchTerm, mode: 'insensitive' } },
          { lastname: { contains: filter.searchTerm, mode: 'insensitive' } },
          { phoneNumber: { contains: filter.searchTerm, mode: 'insensitive' } },
          { address: { contains: filter.searchTerm, mode: 'insensitive' } },
          { account: { email: { contains: filter.searchTerm, mode: 'insensitive' } } },
          { account: { username: { contains: filter.searchTerm, mode: 'insensitive' } } }
        ]
      }

      if (filter.hasAppointments !== undefined) {
        if (filter.hasAppointments) {
          where.Patient = {
            some: {
              Appointment: { some: {} }
            }
          }
        } else {
          where.Patient = {
            none: {
              Appointment: { some: {} }
            }
          }
        }
      }

      if (filter.isActive !== undefined) {
        where.account = {
          emailIsVerified: filter.isActive
        }
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take,
          where,
          include: {
            account: {
              include: {
                role: true,
                avatar: true
              }
            },
            Patient: {
              include: {
                _count: {
                  select: {
                    Appointment: true
                  }
                }
              }
            },
            _count: {
              select: {
                Patient: true
              }
            }
          }
        }),
        prisma.user.count({ where })
      ])

      // Process avatars for all users
      const processedUsers = await Promise.all(
        users.map(async (user: any) => {
          const avatar = user?.account?.avatar
            ? await this.attachmentService.getAttachmentById(user.account.avatar.id)
            : null
          if (user && user.account) {
            user.account.avatar = avatar
          }
          return user
        })
      )

      return this.formatPaginationResult(processedUsers, total, page, limit)
    } catch (error) {
      this.handleError(error, 'getUsers')
    }
  }

  async getUserAppointments(userId: string, page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      if (!user) {
        throw new Error('User not found')
      }

      // Get appointments through patient relation
      const where = {
        patient: {
          userId: userId
        }
      }

      const include = {
        patient: true,
        medicalRoom: {
          include: {
            service: true,
            department: true
          }
        },
        bookingTime: {
          include: {
            medicalRoomTime: true
          }
        }
      }

      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          skip,
          take,
          where,
          include
        }),
        prisma.appointment.count({ where })
      ])

      return this.formatPaginationResult(appointments, total, page, limit)
    } catch (error) {
      this.handleError(error, 'getUserAppointments')
    }
  }

  async getUserPatients(userId: string, page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      if (!user) {
        throw new Error('User not found')
      }

      const patients = await prisma.patient.findMany({
        where: { userId },
        skip,
        take
      })
      const total = await prisma.patient.count({ where: { userId } })

      return this.formatPaginationResult(patients, total, page, limit)
    } catch (error) {
      this.handleError(error, 'getUserPatients')
    }
  }

  async getUpcomingAppointments(userId: string, limit: number = 5, daysAhead: number = 30) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      if (!user) {
        throw new Error('User not found')
      }

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + daysAhead)

      return await prisma.appointment.findMany({
        where: {
          patient: {
            userId: userId
          },
          status: APPOINTMENTSTATUS.BOOKED,
          bookingTime: {
            medicalRoomTime: {
              fromTime: { gte: new Date() }
            }
          }
        },
        take: limit
      })
    } catch (error) {
      this.handleError(error, 'getUpcomingAppointments')
    }
  }

  async getUserStatistics(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          account: true
        }
      })
      if (!user) {
        throw new Error('User not found')
      }

      // Get appointments through patient relation
      const appointmentWhere = {
        patient: {
          userId: userId
        }
      }

      const [totalAppointments, completedAppointments, cancelledAppointments, totalPatients, upcomingAppointments] =
        await Promise.all([
          prisma.appointment.count({
            where: appointmentWhere
          }),
          prisma.appointment.count({
            where: { ...appointmentWhere, status: APPOINTMENTSTATUS.PAID }
          }),
          prisma.appointment.count({
            where: { ...appointmentWhere, status: APPOINTMENTSTATUS.CANCEL }
          }),
          prisma.patient.count({ where: { userId } }),
          prisma.appointment.count({
            where: {
              ...appointmentWhere,
              status: APPOINTMENTSTATUS.BOOKED,
              bookingTime: {
                medicalRoomTime: {
                  fromTime: { gte: new Date() }
                }
              }
            }
          })
        ])

      const attendanceRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0

      return {
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        upcomingAppointments,
        totalPatients,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        accountVerified: user.account?.emailIsVerified || false
      }
    } catch (error) {
      this.handleError(error, 'getUserStatistics')
    }
  }

  async searchUsers(searchTerm: string, page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      const users = await prisma.user.findMany({
        where: {
          OR: [
            { firstname: { contains: searchTerm, mode: 'insensitive' } },
            { lastname: { contains: searchTerm, mode: 'insensitive' } },
            { phoneNumber: { contains: searchTerm, mode: 'insensitive' } },
            { address: { contains: searchTerm, mode: 'insensitive' } },
            { account: { email: { contains: searchTerm, mode: 'insensitive' } } },
            { account: { username: { contains: searchTerm, mode: 'insensitive' } } }
          ]
        },
        skip,
        take
      })
      const total = await prisma.user.count({
        where: {
          OR: [
            { firstname: { contains: searchTerm, mode: 'insensitive' } },
            { lastname: { contains: searchTerm, mode: 'insensitive' } },
            { phoneNumber: { contains: searchTerm, mode: 'insensitive' } },
            { address: { contains: searchTerm, mode: 'insensitive' } },
            { account: { email: { contains: searchTerm, mode: 'insensitive' } } },
            { account: { username: { contains: searchTerm, mode: 'insensitive' } } }
          ]
        }
      })

      return this.formatPaginationResult(users, total, page, limit)
    } catch (error) {
      this.handleError(error, 'searchUsers')
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id }
      })
      if (!user) {
        throw new Error('User not found')
      }

      // Check for active appointments through patient relation
      const activeAppointments = await prisma.appointment.count({
        where: {
          patient: {
            userId: id
          },
          status: { in: [APPOINTMENTSTATUS.BOOKED, APPOINTMENTSTATUS.PAID] },
          bookingTime: {
            medicalRoomTime: {
              fromTime: { gte: new Date() }
            }
          }
        }
      })

      if (activeAppointments > 0) {
        throw new Error('Cannot delete user with active appointments. Cancel appointments first.')
      }

      // Delete related records first
      await prisma.appointment.deleteMany({
        where: {
          patient: {
            userId: id
          }
        }
      })
      await prisma.patient.deleteMany({
        where: { userId: id }
      })

      // Delete user
      await prisma.user.delete({
        where: { id }
      })
    } catch (error) {
      this.handleError(error, 'deleteUser')
    }
  }

  async getUserProfile(userId: string) {
    try {
      let user: any = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          account: {
            include: {
              role: true,
              avatar: true
            }
          },
          Patient: {
            include: {
              _count: {
                select: {
                  Appointment: true
                }
              }
            }
          }
        }
      })
      if (!user) {
        throw new Error('User not found')
      }

      const avatar = user?.account.avatar
        ? await this.attachmentService.getAttachmentById(user.account.avatar.id)
        : null
      if (user && user.account) {
        user.account.avatar = avatar
      }

      const statistics = await this.getUserStatistics(userId)
      const recentAppointments = await prisma.appointment.findMany({
        where: {
          patient: {
            userId: userId
          }
        },
        take: 3
      })

      return {
        ...user,
        statistics,
        recentAppointments,
        preferences: await this.getUserPreferences(userId)
      }
    } catch (error) {
      this.handleError(error, 'getUserProfile')
    }
  }

  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      // For now, return default preferences
      // In the future, you might want to store these in a separate table
      return {
        language: 'vi',
        timezone: 'Asia/Ho_Chi_Minh',
        notifications: {
          email: true,
          sms: false,
          push: true,
          appointmentReminders: true,
          promotionalMessages: false
        },
        appointmentSettings: {
          defaultDuration: 30,
          preferredTimeSlots: ['09:00', '14:00'],
          preferredDepartments: []
        }
      }
    } catch (error) {
      this.handleError(error, 'getUserPreferences')
    }
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      if (!user) {
        throw new Error('User not found')
      }

      // For now, just merge with existing preferences
      // In a real implementation, you'd store these in a database
      const currentPreferences = await this.getUserPreferences(userId)
      const updatedPreferences = {
        ...currentPreferences,
        ...preferences,
        notifications: {
          ...currentPreferences.notifications,
          ...preferences.notifications
        },
        appointmentSettings: {
          ...currentPreferences.appointmentSettings,
          ...preferences.appointmentSettings
        }
      }

      // Here you would save to database
      // For now, just return the merged preferences
      return updatedPreferences
    } catch (error) {
      this.handleError(error, 'updateUserPreferences')
    }
  }

  async addPatient(
    userId: string,
    patientData: {
      firstname: string
      lastname: string
      phoneNumber?: string
      address?: string
      relationship?: string
    }
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      if (!user) {
        throw new Error('User not found')
      }

      return await prisma.patient.create({
        data: {
          user: { connect: { id: userId } },
          firstname: patientData.firstname,
          lastname: patientData.lastname,
          phoneNumber: patientData.phoneNumber,
          address: patientData.address
        }
      })
    } catch (error) {
      this.handleError(error, 'addPatient')
    }
  }

  async getUserActivity(userId: string, page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      // Get appointments through patient relation
      const where = {
        patient: {
          userId: userId
        }
      }

      const include = {
        patient: true,
        medicalRoom: {
          include: {
            service: true,
            department: true
          }
        },
        bookingTime: {
          include: {
            medicalRoomTime: true
          }
        }
      }

      const appointments = await prisma.appointment.findMany({
        skip,
        take,
        where,
        include,
        orderBy: {
          bookingTime: {
            medicalRoomTime: {
              fromTime: 'desc'
            }
          }
        }
      })
      const total = await prisma.appointment.count({ where })

      const activities = appointments.map((appointment) => ({
        id: appointment.id,
        type: 'appointment',
        description: `Appointment with ${appointment.medicalRoom?.service?.name || 'Service'}`,
        timestamp: appointment.bookingTime?.medicalRoomTime?.fromTime,
        status: appointment.status,
        metadata: {
          appointmentId: appointment.id,
          department: appointment.medicalRoom?.department?.name,
          service: appointment.medicalRoom?.service?.name
        }
      }))

      return this.formatPaginationResult(activities, total, page, limit)
    } catch (error) {
      this.handleError(error, 'getUserActivity')
    }
  }

  async getUserAnalytics(userId?: string, metricType: string = 'appointments', fromDate?: Date, toDate?: Date) {
    try {
      const where: any = {}

      if (userId) {
        where.patient = {
          userId: userId
        }
      }

      if (fromDate || toDate) {
        where.createdAt = {}
        if (fromDate) where.createdAt.gte = fromDate
        if (toDate) where.createdAt.lte = toDate
      }

      switch (metricType) {
        case 'appointments': {
          const [total, completed, cancelled, upcoming] = await Promise.all([
            prisma.appointment.count(where),
            prisma.appointment.count({ ...where, status: APPOINTMENTSTATUS.PAID }),
            prisma.appointment.count({ ...where, status: APPOINTMENTSTATUS.CANCEL }),
            prisma.appointment.count({
              ...where,
              status: APPOINTMENTSTATUS.BOOKED,
              bookingTime: {
                medicalRoomTime: {
                  fromTime: { gte: new Date() }
                }
              }
            })
          ])

          return {
            metricType,
            data: { total, completed, cancelled, upcoming },
            period: { fromDate, toDate }
          }
        }

        case 'patients': {
          if (!userId) {
            const totalUsers = await prisma.user.count()
            const usersWithPatients = await prisma.user.count({
              where: {
                Patient: { some: {} }
              }
            })
            return {
              metricType,
              data: { totalUsers, usersWithPatients },
              period: { fromDate, toDate }
            }
          } else {
            const totalPatients = await prisma.patient.count({ where: { userId } })
            return {
              metricType,
              data: { totalPatients },
              period: { fromDate, toDate }
            }
          }
        }

        default:
          throw new Error(`Unknown metric type: ${metricType}`)
      }
    } catch (error) {
      this.handleError(error, 'getUserAnalytics')
    }
  }

  async bulkUpdateUsers(userIds: string[], updateData: Partial<UpdateUserData>): Promise<number> {
    try {
      let updatedCount = 0

      for (const userId of userIds) {
        try {
          await this.updateUser(userId, updateData)
          updatedCount++
        } catch (error: any) {
          console.warn(`Failed to update user ${userId}: ${error.message}`)
        }
      }

      return updatedCount
    } catch (error) {
      this.handleError(error, 'bulkUpdateUsers')
    }
  }

  // async exportUsers(userIds?: string[], format: 'csv' | 'excel' | 'json' = 'json') {
  //   try {
  //     const where = userIds ? { id: { in: userIds } } : {}
  //     const users = await this.userRepository.findMany(0, 1000, where, {
  //       account: {
  //         include: {
  //           email: true,
  //           role: true
  //         }
  //       },
  //       Patient: {
  //         include: {
  //           _count: {
  //             select: {
  //               Appointment: true
  //             }
  //           }
  //         }
  //       },
  //       _count: {
  //         select: {
  //           Patient: true
  //         }
  //       }
  //     })

  //     const exportData = users.map((user) => ({
  //       id: user.id,
  //       firstname: user.firstname,
  //       lastname: user.lastname,
  //       email: user.account?.email,
  //       phoneNumber: user.phoneNumber,
  //       address: user.address,
  //       role: user.account?.role?.name,
  //       emailVerified: user.account?.emailIsVerified,
  //       totalPatients: user._count?.Patient || 0,
  //       totalAppointments: user.Patient?.reduce((sum, patient) => sum + (patient._count?.Appointment || 0), 0) || 0,
  //       createdAt: user.createdAt,
  //       updatedAt: user.updatedAt
  //     }))

  //     return {
  //       data: exportData,
  //       format,
  //       generatedAt: new Date(),
  //       totalRecords: exportData.length
  //     }
  //   } catch (error) {
  //     this.handleError(error, 'exportUsers')
  //   }
  // }
}
