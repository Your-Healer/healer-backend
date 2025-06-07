import { Prisma, ShiftWorking } from '@prisma/client'
import prisma from '~/libs/prisma/init'
import BaseService from './base.service'
import {
  CreateShiftWorkingDto,
  UpdateShiftWorkingDto,
  GetShiftWorkingDto,
  BulkShiftWorkingDto,
  RecurringShiftWorkingDto,
  AssignShiftWorkingDto,
  CheckShiftConflictsDto,
  ShiftWorkingStatisticsDto
} from '~/dtos/shiftWorking.dto'

export default class ShiftWorkingService extends BaseService {
  private static instance: ShiftWorkingService

  private constructor() {
    super()
  }

  static getInstance(): ShiftWorkingService {
    if (!ShiftWorkingService.instance) {
      ShiftWorkingService.instance = new ShiftWorkingService()
    }
    return ShiftWorkingService.instance
  }

  async createShift(data: CreateShiftWorkingDto): Promise<ShiftWorking> {
    try {
      const staff = await prisma.staff.findUnique({
        where: { id: data.staffId }
      })
      if (!staff) {
        throw new Error('Staff member not found')
      }

      const room = await prisma.medicalRoom.findUnique({
        where: { id: data.roomId }
      })
      if (!room) {
        throw new Error('Medical room not found')
      }

      if (data.fromTime >= data.toTime) {
        throw new Error('Start time must be before end time')
      }

      if (data.fromTime <= new Date()) {
        throw new Error('Cannot create shifts in the past')
      }

      const conflicts = await this.checkShiftConflicts({
        staffId: data.staffId,
        fromTime: data.fromTime,
        toTime: data.toTime
      })

      if (conflicts.hasConflict) {
        throw new Error('ShiftWorking conflicts with existing schedule')
      }

      const shiftData: Prisma.ShiftWorkingCreateInput = {
        staff: { connect: { id: data.staffId } },
        room: { connect: { id: data.roomId } },
        fromTime: data.fromTime,
        toTime: data.toTime
      }

      return await prisma.shiftWorking.create({
        data: shiftData,
        include: {
          staff: true,
          room: {
            include: {
              department: true,
              service: true
            }
          }
        }
      })
    } catch (error) {
      this.handleError(error, 'createShift')
    }
  }

  async updateShift(id: string, data: UpdateShiftWorkingDto): Promise<ShiftWorking> {
    try {
      const existingShift = await prisma.shiftWorking.findUnique({
        where: { id }
      })

      if (!existingShift) {
        throw new Error('ShiftWorking not found')
      }

      // Validate time slot if changing
      if (data.fromTime && data.toTime && data.fromTime >= data.toTime) {
        throw new Error('Start time must be before end time')
      }

      // Check for conflicts if changing time or staff
      if (data.staffId || data.fromTime || data.toTime) {
        const conflicts = await this.checkShiftConflicts({
          staffId: data.staffId || existingShift.staffId,
          fromTime: data.fromTime || existingShift.fromTime,
          toTime: data.toTime || existingShift.toTime,
          excludeShiftId: id
        })

        if (conflicts.hasConflict) {
          throw new Error('Updated shift conflicts with existing schedule')
        }
      }

      const updateData: Prisma.ShiftWorkingUpdateInput = {
        staff: data.staffId ? { connect: { id: data.staffId } } : undefined,
        room: data.roomId ? { connect: { id: data.roomId } } : undefined,
        fromTime: data.fromTime,
        toTime: data.toTime
      }

      return await prisma.shiftWorking.update({
        where: { id },
        data: updateData,
        include: {
          staff: true,
          room: {
            include: {
              department: true,
              service: true
            }
          }
        }
      })
    } catch (error) {
      this.handleError(error, 'updateShift')
    }
  }

  async getShifts(data: GetShiftWorkingDto) {
    try {
      const { skip, take } = this.calculatePagination(data.page, data.limit)

      const where: any = {}

      if (data.staffId) where.doctorId = data.staffId
      if (data.roomId) where.roomId = data.roomId

      if (data.departmentId) {
        where.room = {
          departmentId: data.departmentId
        }
      }

      if (data.date) {
        const startOfDay = new Date(data.date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(data.date)
        endOfDay.setHours(23, 59, 59, 999)

        where.AND = [{ fromTime: { gte: startOfDay } }, { fromTime: { lte: endOfDay } }]
      } else if (data.fromDate || data.toDate) {
        where.AND = []
        if (data.fromDate) {
          where.AND.push({ fromTime: { gte: data.fromDate } })
        }
        if (data.toDate) {
          where.AND.push({ toTime: { lte: data.toDate } })
        }
      }

      // Filter by status
      if (data.status) {
        const now = new Date()
        switch (data.status) {
          case 'upcoming':
            where.fromTime = { gt: now }
            break
          case 'active':
            where.AND = [{ fromTime: { lte: now } }, { toTime: { gt: now } }]
            break
          case 'completed':
            where.toTime = { lte: now }
            break
        }
      }

      const [shifts, total] = await Promise.all([
        prisma.shiftWorking.findMany({
          skip,
          take,
          where,
          include: {
            staff: {
              include: {
                account: true
              }
            },
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
        }),
        prisma.shiftWorking.count({ where })
      ])

      return this.formatPaginationResult(shifts, total, data.page, data.limit)
    } catch (error) {
      this.handleError(error, 'getShifts')
    }
  }

  async deleteShift(id: string): Promise<void> {
    try {
      const shift = await prisma.shiftWorking.findUnique({
        where: { id }
      })

      if (!shift) {
        throw new Error('ShiftWorking not found')
      }

      // Check if shift is in the past or currently active
      const now = new Date()
      if (shift.toTime <= now) {
        throw new Error('Cannot delete completed shifts')
      }

      if (shift.fromTime <= now && shift.toTime > now) {
        throw new Error('Cannot delete currently active shifts')
      }

      await prisma.shiftWorking.delete({
        where: { id }
      })
    } catch (error) {
      this.handleError(error, 'deleteShift')
    }
  }

  async createBulkShifts(data: BulkShiftWorkingDto) {
    try {
      const createdShifts: ShiftWorking[] = []
      const errors: string[] = []

      for (const date of data.dates) {
        try {
          const shifts = []

          // Morning shift
          if (data.morningShift) {
            const fromTime = new Date(date)
            fromTime.setHours(data.morningShift.startHour, 0, 0, 0)
            const toTime = new Date(date)
            toTime.setHours(data.morningShift.endHour, 0, 0, 0)

            shifts.push({ fromTime, toTime })
          }

          // Afternoon shift
          if (data.afternoonShift) {
            const fromTime = new Date(date)
            fromTime.setHours(data.afternoonShift.startHour, 0, 0, 0)
            const toTime = new Date(date)
            toTime.setHours(data.afternoonShift.endHour, 0, 0, 0)

            shifts.push({ fromTime, toTime })
          }

          for (const shift of shifts) {
            const conflicts = await this.checkShiftConflicts({
              staffId: data.staffId,
              fromTime: shift.fromTime,
              toTime: shift.toTime
            })

            if (!conflicts.hasConflict) {
              const created = await this.createShift({
                staffId: data.staffId,
                roomId: data.roomId,
                fromTime: shift.fromTime,
                toTime: shift.toTime
              })
              createdShifts.push(created)
            } else {
              errors.push(`Conflict detected for ${date.toDateString()}`)
            }
          }
        } catch (error: any) {
          errors.push(`Failed to create shift for ${date.toDateString()}: ${error.message}`)
        }
      }

      return {
        message: 'Bulk shifts created successfully',
        createdShifts,
        totalRequested: data.dates.length * ((data.morningShift ? 1 : 0) + (data.afternoonShift ? 1 : 0)),
        totalCreated: createdShifts.length,
        skipped: errors.length,
        errors
      }
    } catch (error) {
      this.handleError(error, 'createBulkShifts')
    }
  }

  async checkShiftConflicts(data: CheckShiftConflictsDto) {
    try {
      const where: any = {
        doctorId: data.staffId,
        AND: [{ fromTime: { lt: data.toTime } }, { toTime: { gt: data.fromTime } }]
      }

      if (data.excludeShiftId) {
        where.id = { not: data.excludeShiftId }
      }

      const conflicts = await prisma.shiftWorking.findMany({
        where,
        include: {
          staff: true,
          room: {
            include: {
              department: true,
              service: true
            }
          }
        }
      })

      return {
        hasConflict: conflicts.length > 0,
        conflicts,
        message:
          conflicts.length > 0
            ? `Found ${conflicts.length} conflicting shifts`
            : 'No conflicts found for the specified time slot'
      }
    } catch (error) {
      this.handleError(error, 'checkShiftConflicts')
    }
  }

  async getShiftStatistics(data: ShiftWorkingStatisticsDto) {
    try {
      const where: any = {}

      if (data.fromDate || data.toDate) {
        where.AND = []
        if (data.fromDate) {
          where.AND.push({ fromTime: { gte: data.fromDate } })
        }
        if (data.toDate) {
          where.AND.push({ toTime: { lte: data.toDate } })
        }
      }

      if (data.departmentId) {
        where.room = {
          departmentId: data.departmentId
        }
      }

      const now = new Date()

      const [totalShifts, activeShifts, upcomingShifts, completedShifts, totalStaffMembers, shifts] = await Promise.all(
        [
          prisma.shiftWorking.count({ where }),
          prisma.shiftWorking.count({
            where: {
              ...where,
              fromTime: { lte: now },
              toTime: { gt: now }
            }
          }),
          prisma.shiftWorking.count({
            where: {
              ...where,
              fromTime: { gt: now }
            }
          }),
          prisma.shiftWorking.count({
            where: {
              ...where,
              toTime: { lte: now }
            }
          }),
          prisma.shiftWorking
            .groupBy({
              by: ['staffId'],
              where
            })
            .then((result) => result.length),
          prisma.shiftWorking.findMany({
            where,
            include: {
              staff: true,
              room: {
                include: {
                  department: true
                }
              }
            }
          })
        ]
      )

      // Calculate average shift duration
      const totalDuration = shifts.reduce((acc, shift) => {
        const duration = (shift.toTime.getTime() - shift.fromTime.getTime()) / (1000 * 60 * 60)
        return acc + duration
      }, 0)
      const averageShiftDuration = totalShifts > 0 ? totalDuration / totalShifts : 0

      // Find most assigned staff
      const staffShiftCounts = shifts.reduce(
        (acc, shift) => {
          acc[shift.staffId] = (acc[shift.staffId] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      const mostAssignedStaffId = Object.keys(staffShiftCounts).reduce((a, b) =>
        staffShiftCounts[a] > staffShiftCounts[b] ? a : b
      )

      const mostAssignedStaff = shifts.find((s) => s.staffId === mostAssignedStaffId)?.staff

      // Department distribution
      const departmentDistribution = shifts.reduce(
        (acc, shift) => {
          const deptName = shift.room.department.name
          acc[deptName] = (acc[deptName] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      return {
        totalShifts,
        activeShifts,
        upcomingShifts,
        completedShifts,
        totalStaffMembers,
        averageShiftDuration: Math.round(averageShiftDuration * 100) / 100,
        mostAssignedStaff: mostAssignedStaff
          ? {
              staffId: mostAssignedStaff.id,
              name: `${mostAssignedStaff.firstname} ${mostAssignedStaff.lastname}`,
              shiftCount: staffShiftCounts[mostAssignedStaffId]
            }
          : null,
        departmentDistribution: Object.entries(departmentDistribution).map(([name, count]) => ({
          departmentName: name,
          shiftCount: count
        }))
      }
    } catch (error) {
      this.handleError(error, 'getShiftStatistics')
    }
  }
}
