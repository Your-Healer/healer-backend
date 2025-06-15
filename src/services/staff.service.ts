import { Prisma, Staff, Account, EDUCATIONLEVEL } from '@prisma/client'
import prisma from '~/libs/prisma/init'
import BaseService from './base.service'
import {
  CreateStaffDto,
  UpdateStaffDto,
  GetStaffDto,
  StaffSearchDto,
  BulkStaffOperationDto,
  BulkUpdateStaffDto,
  StaffStatisticsDto,
  StaffWorkloadDto,
  StaffScheduleDto,
  GetStaffAppointmentsDto,
  GetStaffPatientsDto,
  GetStaffShiftsDto
} from '~/dtos/staff.dto'
import bcrypt from 'bcrypt'
import BlockchainService from './blockchain.service'
import cryptoJs from 'crypto-js'
import config from '~/configs/env'

export default class StaffService extends BaseService {
  private static instance: StaffService
  private blockchainService: BlockchainService

  private constructor() {
    super()
    this.blockchainService = BlockchainService.getInstance()
  }

  static getInstance(): StaffService {
    if (!StaffService.instance) {
      StaffService.instance = new StaffService()
    }
    return StaffService.instance
  }

  async createStaff(data: CreateStaffDto): Promise<{ account: Account; staff: Staff }> {
    try {
      const existingAccount = await prisma.account.findFirst({
        where: {
          OR: [
            { username: data.username },
            { email: data.email },
            ...(data.phoneNumber ? [{ phoneNumber: data.phoneNumber }] : [])
          ]
        }
      })

      if (existingAccount) {
        throw new Error('Account with this username, email, or phone number already exists')
      }

      const staffRole = await prisma.role.findFirst({
        where: { name: 'STAFF' }
      })
      if (!staffRole) {
        throw new Error('Staff role not found')
      }

      const hashedPassword = await bcrypt.hash(data.password, 10)

      const result = await prisma.$transaction(async (tx) => {
        const account = await tx.account.create({
          data: {
            username: data.username,
            password: hashedPassword,
            email: data.email,
            phoneNumber: data.phoneNumber,
            roleId: staffRole.id,
            walletAddress: data.walletAddress,
            walletMnemonic: data.walletMnemonic,
            emailIsVerified: true
          }
        })

        const staff = await tx.staff.create({
          data: {
            accountId: account.id,
            firstname: data.firstname,
            lastname: data.lastname,
            introduction: data.introduction,
            educationLevel: data.educationLevel as EDUCATIONLEVEL
          }
        })

        await this.blockchainService.forceSetBalance(data.walletAddress, BigInt(1000000000))

        // Assign positions if provided
        if (data.positionIds && data.positionIds.length > 0) {
          await tx.positionStaff.createMany({
            data: data.positionIds.map((positionId) => ({
              staffId: staff.id,
              positionId
            }))
          })
        }

        // Assign departments if provided
        if (data.departmentIds && data.departmentIds.length > 0) {
          await tx.staffOnDepartment.createMany({
            data: data.departmentIds.map((departmentId) => ({
              staffId: staff.id,
              departmentId
            }))
          })
        }

        return { account, staff }
      })

      return result
    } catch (error) {
      this.handleError(error, 'createStaff')
    }
  }

  async getAllStaff(data: GetStaffDto) {
    try {
      const { skip, take } = this.calculatePagination(data.page, data.limit)

      const where: any = {}

      if (data.departmentId) {
        where.departments = {
          some: {
            departmentId: data.departmentId
          }
        }
      }

      if (data.positionId) {
        where.positions = {
          some: {
            positionId: data.positionId
          }
        }
      }

      if (data.educationLevel) {
        where.educationLevel = data.educationLevel
      }

      if (data.query) {
        where.OR = [
          { firstname: { contains: data.query, mode: 'insensitive' } },
          { lastname: { contains: data.query, mode: 'insensitive' } }
        ]
      }

      const [staff, total] = await Promise.all([
        prisma.staff.findMany({
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
            positions: {
              include: {
                position: true
              }
            },
            departments: {
              include: {
                department: {
                  include: {
                    location: true
                  }
                }
              }
            }
          }
        }),
        prisma.staff.count({ where })
      ])

      return this.formatPaginationResult(staff, total, data.page, data.limit)
    } catch (error) {
      this.handleError(error, 'getAllStaff')
    }
  }

  async getStaffById(id: string) {
    try {
      return await prisma.staff.findUnique({
        where: { id },
        include: {
          account: {
            include: {
              role: true,
              avatar: true
            }
          },
          positions: {
            include: {
              position: true
            }
          },
          departments: {
            include: {
              department: {
                include: {
                  location: true
                }
              }
            }
          }
        }
      })
    } catch (error) {
      this.handleError(error, 'getStaffById')
    }
  }

  async updateStaff(id: string, data: UpdateStaffDto): Promise<Staff> {
    try {
      const existingStaff = await prisma.staff.findUnique({
        where: { id }
      })

      if (!existingStaff) {
        throw new Error('Staff member not found')
      }

      const result = await prisma.$transaction(async (tx) => {
        // Update staff basic info
        const staff = await tx.staff.update({
          where: { id },
          data: {
            firstname: data.firstname,
            lastname: data.lastname,
            introduction: data.introduction,
            educationLevel: data.educationLevel as EDUCATIONLEVEL
          }
        })

        // Update positions if provided
        if (data.positionIds !== undefined) {
          // Remove existing positions
          await tx.positionStaff.deleteMany({
            where: { staffId: id }
          })

          // Add new positions
          if (data.positionIds.length > 0) {
            await tx.positionStaff.createMany({
              data: data.positionIds.map((positionId) => ({
                staffId: id,
                positionId
              }))
            })
          }
        }

        // Update departments if provided
        if (data.departmentIds !== undefined) {
          // Remove existing departments
          await tx.staffOnDepartment.deleteMany({
            where: { staffId: id }
          })

          // Add new departments
          if (data.departmentIds.length > 0) {
            await tx.staffOnDepartment.createMany({
              data: data.departmentIds.map((departmentId) => ({
                staffId: id,
                departmentId
              }))
            })
          }
        }

        return staff
      })

      return result
    } catch (error) {
      this.handleError(error, 'updateStaff')
    }
  }

  async deleteStaff(id: string): Promise<void> {
    try {
      const staff = await prisma.staff.findUnique({
        where: { id },
        include: {
          account: true
        }
      })

      if (!staff) {
        throw new Error('Staff member not found')
      }

      // Check for active assignments
      const activeShifts = await prisma.shiftWorking.count({
        where: {
          staffId: id,
          fromTime: { gte: new Date() }
        }
      })

      if (activeShifts > 0) {
        throw new Error('Cannot delete staff member with active shifts')
      }

      await prisma.$transaction(async (tx) => {
        // Delete staff positions and departments
        await tx.positionStaff.deleteMany({ where: { staffId: id } })
        await tx.staffOnDepartment.deleteMany({ where: { staffId: id } })

        // Delete staff
        await tx.staff.delete({ where: { id } })

        // Delete account
        await tx.account.delete({ where: { id: staff.accountId } })
      })
    } catch (error) {
      this.handleError(error, 'deleteStaff')
    }
  }

  async searchStaff(data: StaffSearchDto) {
    try {
      const { skip, take } = this.calculatePagination(data.page, data.limit)

      const where: any = {
        OR: [
          { firstname: { contains: data.query, mode: 'insensitive' } },
          { lastname: { contains: data.query, mode: 'insensitive' } },
          { account: { username: { contains: data.query, mode: 'insensitive' } } }
        ]
      }

      if (data.departmentId) {
        where.departments = {
          some: { departmentId: data.departmentId }
        }
      }

      if (data.positionId) {
        where.positions = {
          some: { positionId: data.positionId }
        }
      }

      if (data.educationLevel) {
        where.educationLevel = data.educationLevel
      }

      const [staff, total] = await Promise.all([
        prisma.staff.findMany({
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
            positions: {
              include: {
                position: true
              }
            },
            departments: {
              include: {
                department: {
                  include: {
                    location: true
                  }
                }
              }
            }
          }
        }),
        prisma.staff.count({ where })
      ])

      return this.formatPaginationResult(staff, total, data.page, data.limit)
    } catch (error) {
      this.handleError(error, 'searchStaff')
    }
  }

  async getStaffProfile(accountId: string) {
    try {
      return await prisma.staff.findFirst({
        where: { accountId },
        include: {
          account: {
            include: {
              role: true,
              avatar: true
            }
          },
          positions: {
            include: {
              position: true
            }
          },
          departments: {
            include: {
              department: {
                include: {
                  location: true
                }
              }
            }
          }
        }
      })
    } catch (error) {
      this.handleError(error, 'getStaffProfile')
    }
  }

  async updateStaffProfile(accountId: string, data: UpdateStaffDto): Promise<Staff> {
    try {
      const staff = await prisma.staff.findFirst({
        where: { accountId }
      })

      if (!staff) {
        throw new Error('Staff profile not found')
      }

      return await this.updateStaff(staff.id, data)
    } catch (error) {
      this.handleError(error, 'updateStaffProfile')
    }
  }

  async getStaffShifts(accountId: string, data: GetStaffShiftsDto) {
    try {
      const staff = await prisma.staff.findFirst({
        where: { accountId }
      })

      if (!staff) {
        throw new Error('Staff not found')
      }

      const where: any = { doctorId: staff.id }

      if (data.fromDate || data.toDate) {
        where.AND = []
        if (data.fromDate) {
          where.AND.push({ fromTime: { gte: data.fromDate } })
        }
        if (data.toDate) {
          where.AND.push({ toTime: { lte: data.toDate } })
        }
      }

      return await prisma.shiftWorking.findMany({
        where,
        include: {
          room: {
            include: {
              department: {
                include: {
                  location: true
                }
              },
              service: true
            }
          }
        },
        orderBy: {
          fromTime: 'asc'
        }
      })
    } catch (error) {
      this.handleError(error, 'getStaffShifts')
    }
  }

  async getStaffAppointments(accountId: string, data: GetStaffAppointmentsDto) {
    try {
      const staff = await prisma.staff.findFirst({
        where: { accountId }
      })

      if (!staff) {
        throw new Error('Staff not found')
      }

      const { skip, take } = this.calculatePagination(data.page, data.limit)

      const where: any = {
        bookingTime: {
          medicalRoomTime: {
            room: {
              shifts: {
                some: {
                  doctorId: staff.id
                }
              }
            }
          }
        }
      }

      if (data.status) {
        where.status = data.status
      }

      if (data.date) {
        const startOfDay = new Date(data.date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(data.date)
        endOfDay.setHours(23, 59, 59, 999)

        where.bookingTime.medicalRoomTime.fromTime = {
          gte: startOfDay,
          lte: endOfDay
        }
      }

      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          skip,
          take,
          where,
          include: {
            user: true,
            patient: true,
            medicalRoom: {
              include: {
                department: true,
                service: true
              }
            },
            bookingTime: {
              include: {
                medicalRoomTime: true
              }
            }
          }
        }),
        prisma.appointment.count({ where })
      ])

      return this.formatPaginationResult(appointments, total, data.page, data.limit)
    } catch (error) {
      this.handleError(error, 'getStaffAppointments')
    }
  }

  async getStaffStatistics(data: StaffStatisticsDto) {
    try {
      const where: any = {}

      if (data.departmentId) {
        where.departments = {
          some: { departmentId: data.departmentId }
        }
      }

      const [totalStaff, doctorCount, nurseCount, receptionistCount, departmentDistribution, educationDistribution] =
        await Promise.all([
          prisma.staff.count(where),
          prisma.staff.count({
            ...where,
            positions: {
              some: {
                position: { name: { contains: 'doctor', mode: 'insensitive' } }
              }
            }
          }),
          prisma.staff.count({
            ...where,
            positions: {
              some: {
                position: { name: { contains: 'nurse', mode: 'insensitive' } }
              }
            }
          }),
          prisma.staff.count({
            ...where,
            positions: {
              some: {
                position: { name: { contains: 'receptionist', mode: 'insensitive' } }
              }
            }
          }),
          prisma.staffOnDepartment.groupBy({
            by: ['departmentId'],
            _count: { staffId: true },
            where: data.departmentId ? { departmentId: data.departmentId } : undefined
          }),
          prisma.staff.groupBy({
            by: ['educationLevel'],
            _count: { id: true },
            where
          })
        ])

      // Get department names
      const departments = await prisma.department.findMany({
        where: {
          id: { in: departmentDistribution.map((d) => d.departmentId) }
        }
      })

      const departmentStats = departmentDistribution.map((dist) => {
        const dept = departments.find((d) => d.id === dist.departmentId)
        return {
          departmentName: dept?.name || 'Unknown',
          staffCount: dist._count.staffId
        }
      })

      const educationLevelStats = educationDistribution.reduce(
        (acc, curr) => {
          acc[curr.educationLevel || 'Unknown'] = curr._count.id
          return acc
        },
        {} as Record<string, number>
      )

      return {
        totalStaff,
        doctorCount,
        nurseCount,
        receptionistCount,
        departmentDistribution: departmentStats,
        educationLevelDistribution: educationLevelStats
      }
    } catch (error) {
      this.handleError(error, 'getStaffStatistics')
    }
  }

  async getStaffWorkload(data: StaffWorkloadDto) {
    try {
      const where: any = {}

      if (data.departmentId) {
        where.departments = {
          some: { departmentId: data.departmentId }
        }
      }

      const staff = await prisma.staff.findMany({
        where,
        include: {
          shifts: {
            where: {
              ...(data.fromDate && { fromTime: { gte: data.fromDate } }),
              ...(data.toDate && { toTime: { lte: data.toDate } })
            }
          }
        }
      })

      const workloadData = staff.map((member) => {
        const shifts = member.shifts
        const totalShifts = shifts.length
        const totalHours = shifts.reduce((acc, shift) => {
          const duration = (shift.toTime.getTime() - shift.fromTime.getTime()) / (1000 * 60 * 60)
          return acc + duration
        }, 0)
        const averageShiftDuration = totalShifts > 0 ? totalHours / totalShifts : 0
        const upcomingShifts = shifts.filter((s) => s.fromTime > new Date()).length
        const completedShifts = shifts.filter((s) => s.toTime <= new Date()).length

        return {
          staffId: member.id,
          staffName: `${member.firstname} ${member.lastname}`,
          totalShifts,
          totalHours: Math.round(totalHours * 100) / 100,
          averageShiftDuration: Math.round(averageShiftDuration * 100) / 100,
          upcomingShifts,
          completedShifts
        }
      })

      // Sort by specified criteria
      if (data.sortBy) {
        workloadData.sort((a, b) => {
          switch (data.sortBy) {
            case 'totalHours':
              return b.totalHours - a.totalHours
            case 'totalShifts':
              return b.totalShifts - a.totalShifts
            case 'averageDuration':
              return b.averageShiftDuration - a.averageShiftDuration
            default:
              return b.totalHours - a.totalHours
          }
        })
      }

      return workloadData
    } catch (error) {
      this.handleError(error, 'getStaffWorkload')
    }
  }

  async bulkAssignStaff(data: BulkStaffOperationDto) {
    try {
      const results = {
        message: '',
        processedCount: 0,
        totalRequested: data.staffIds.length,
        errors: [] as string[]
      }

      await prisma.$transaction(async (tx) => {
        for (const staffId of data.staffIds) {
          try {
            // Assign to department if provided
            if (data.departmentId) {
              await tx.staffOnDepartment.upsert({
                where: {
                  staffId_departmentId: {
                    staffId,
                    departmentId: data.departmentId
                  }
                },
                update: {},
                create: {
                  staffId,
                  departmentId: data.departmentId
                }
              })
            }

            // Assign positions if provided
            if (data.positionIds && data.positionIds.length > 0) {
              for (const positionId of data.positionIds) {
                await tx.positionStaff.upsert({
                  where: {
                    positionId_staffId: {
                      staffId,
                      positionId
                    }
                  },
                  update: {},
                  create: {
                    staffId,
                    positionId
                  }
                })
              }
            }

            results.processedCount++
          } catch (error: any) {
            results.errors.push(`Failed to process staff ${staffId}: ${error.message}`)
          }
        }
      })

      results.message = `Bulk assignment completed. ${results.processedCount} staff members processed.`
      return results
    } catch (error) {
      this.handleError(error, 'bulkAssignStaff')
    }
  }

  async bulkUpdateStaff(data: BulkUpdateStaffDto) {
    try {
      const results = {
        message: '',
        processedCount: 0,
        totalRequested: data.staffIds.length,
        errors: [] as string[]
      }

      for (const staffId of data.staffIds) {
        try {
          await this.updateStaff(staffId, data.updateData)
          results.processedCount++
        } catch (error: any) {
          results.errors.push(`Failed to update staff ${staffId}: ${error.message}`)
        }
      }

      results.message = `Bulk update completed. ${results.processedCount} staff members updated.`
      return results
    } catch (error) {
      this.handleError(error, 'bulkUpdateStaff')
    }
  }

  async getStaffByDepartment(departmentId: string, page: number, limit: number, positionId?: string) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      const where: any = {
        departments: {
          some: { departmentId }
        }
      }

      if (positionId) {
        where.positions = {
          some: { positionId }
        }
      }

      const [staff, total] = await Promise.all([
        prisma.staff.findMany({
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
            positions: {
              include: {
                position: true
              }
            },
            departments: {
              include: {
                department: {
                  include: {
                    location: true
                  }
                }
              }
            }
          }
        }),
        prisma.staff.count({ where })
      ])

      return this.formatPaginationResult(staff, total, page, limit)
    } catch (error) {
      this.handleError(error, 'getStaffByDepartment')
    }
  }

  async getStaffByPosition(positionId: string, page: number, limit: number, departmentId?: string) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      const where: any = {
        positions: {
          some: { positionId }
        }
      }

      if (departmentId) {
        where.departments = {
          some: { departmentId }
        }
      }

      const [staff, total] = await Promise.all([
        prisma.staff.findMany({
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
            positions: {
              include: {
                position: true
              }
            },
            departments: {
              include: {
                department: {
                  include: {
                    location: true
                  }
                }
              }
            }
          }
        }),
        prisma.staff.count({ where })
      ])

      return this.formatPaginationResult(staff, total, page, limit)
    } catch (error) {
      this.handleError(error, 'getStaffByPosition')
    }
  }
}
