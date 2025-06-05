import { ShiftWorking, Prisma } from '@prisma/client'
import { BaseService } from './base.service'
import prisma from '~/libs/prisma/init'

export interface CreateShiftData {
  staffId: string
  roomId: string
  fromTime: Date
  toTime: Date
}

export interface UpdateShiftData {
  staffId?: string
  roomId?: string
  fromTime?: Date
  toTime?: Date
}

export interface ShiftFilter {
  staffId?: string
  roomId?: string
  departmentId?: string
  date?: Date
  fromDate?: Date
  toDate?: Date
}

export interface BulkShiftData {
  staffId: string
  roomId: string
  dates: Date[]
  morningShift?: { startHour: number; endHour: number }
  afternoonShift?: { startHour: number; endHour: number }
}

export interface RecurringShiftData {
  staffId: string
  roomId: string
  startDate: Date
  endDate: Date
  daysOfWeek: number[] // 0 = Sunday, 1 = Monday, etc.
  timeSlots: Array<{
    startHour: number
    endHour: number
  }>
}

export default class ShiftWorkingService extends BaseService {
  private static instance: ShiftWorkingService

  static getInstance(): ShiftWorkingService {
    if (!ShiftWorkingService.instance) {
      ShiftWorkingService.instance = new ShiftWorkingService()
    }
    return ShiftWorkingService.instance
  }

  async createShift(data: CreateShiftData): Promise<ShiftWorking> {
    try {
      // Validate staff exists and has appropriate position
      const staff = await prisma.staff.findUnique({
        where: { id: data.staffId },
        include: {
          positions: {
            include: {
              position: true
            }
          },
          departments: true
        }
      })
      if (!staff) {
        throw new Error('Doctor not found')
      }

      // Check if staff member has staff position
      const isDoctorPosition = staff.positions?.some(
        (pos) => pos.position?.name === 'Bác sĩ' || pos.position?.name === 'Trưởng khoa'
      )

      if (!isDoctorPosition) {
        throw new Error('Staff member is not a staff')
      }

      // Validate room exists
      const room = await prisma.medicalRoom.findUnique({
        where: { id: data.roomId },
        include: {
          department: true,
          service: true
        }
      })
      if (!room) {
        throw new Error('Medical room not found')
      }

      // Check if staff is assigned to room's department
      const isAssignedToDepartment = staff.departments?.some((dept) => dept.departmentId === room.departmentId)

      if (!isAssignedToDepartment) {
        throw new Error('Doctor is not assigned to this department')
      }

      // Validate shift times
      if (data.fromTime >= data.toTime) {
        throw new Error('Start time must be before end time')
      }

      if (data.fromTime <= new Date()) {
        throw new Error('Cannot create shifts in the past')
      }

      // Check for time conflicts
      const conflicts = await this.checkShiftConflicts(data.staffId, data.fromTime, data.toTime)

      if (conflicts.length > 0) {
        throw new Error('Time conflict with existing staff shift')
      }

      // Check for room conflicts
      const roomConflicts = await prisma.shiftWorking.findMany({
        where: {
          roomId: data.roomId,
          AND: [{ fromTime: { lt: data.toTime } }, { toTime: { gt: data.fromTime } }]
        }
      })

      if (roomConflicts.length > 0) {
        throw new Error('Time conflict with existing room usage')
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
          staff: {
            include: {
              account: true
            }
          },
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

  async updateShift(id: string, data: UpdateShiftData): Promise<ShiftWorking> {
    try {
      const existingShift = await prisma.shiftWorking.findUnique({
        where: { id }
      })
      if (!existingShift) {
        throw new Error('Shift not found')
      }

      // Check if shift has already started
      if (existingShift.fromTime <= new Date()) {
        throw new Error('Cannot update shift that has already started')
      }

      // Prepare updated data with existing values as defaults
      const updateData = {
        staffId: data.staffId || existingShift.staffId,
        roomId: data.roomId || existingShift.roomId,
        fromTime: data.fromTime || existingShift.fromTime,
        toTime: data.toTime || existingShift.toTime
      }

      // Validate new shift times if they're being changed
      if (updateData.fromTime >= updateData.toTime) {
        throw new Error('Start time must be before end time')
      }

      // Check for conflicts if critical fields changed
      if (data.staffId || data.fromTime || data.toTime) {
        const conflicts = await this.checkShiftConflicts(updateData.staffId, updateData.fromTime, updateData.toTime, id)

        if (conflicts.length > 0) {
          throw new Error('Time conflict with existing staff shift')
        }
      }

      const prismaUpdateData: Prisma.ShiftWorkingUpdateInput = {
        staff: data.staffId ? { connect: { id: data.staffId } } : undefined,
        room: data.roomId ? { connect: { id: data.roomId } } : undefined,
        fromTime: data.fromTime,
        toTime: data.toTime
      }

      return await prisma.shiftWorking.update({
        where: { id },
        data: prismaUpdateData,
        include: {
          staff: {
            include: {
              account: true
            }
          },
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

  async deleteShift(id: string): Promise<void> {
    try {
      const shift = await prisma.shiftWorking.findUnique({
        where: { id }
      })
      if (!shift) {
        throw new Error('Shift not found')
      }

      // Check if shift has already started
      if (shift.fromTime <= new Date()) {
        throw new Error('Cannot delete shift that has already started')
      }

      await prisma.shiftWorking.delete({
        where: { id }
      })
    } catch (error) {
      this.handleError(error, 'deleteShift')
    }
  }

  async getShiftById(id: string) {
    try {
      return await prisma.shiftWorking.findUnique({
        where: { id },
        include: {
          staff: {
            include: {
              account: true,
              positions: {
                include: {
                  position: true
                }
              }
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
        }
      })
    } catch (error) {
      this.handleError(error, 'getShiftById')
    }
  }

  async getShifts(filter: ShiftFilter = {}, page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      const where: any = {}

      if (filter.staffId) where.staffId = filter.staffId
      if (filter.roomId) where.roomId = filter.roomId

      if (filter.departmentId) {
        where.room = {
          departmentId: filter.departmentId
        }
      }

      if (filter.date) {
        const startOfDay = new Date(filter.date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(filter.date)
        endOfDay.setHours(23, 59, 59, 999)

        where.fromTime = {
          gte: startOfDay,
          lte: endOfDay
        }
      } else if (filter.fromDate || filter.toDate) {
        where.fromTime = {}
        if (filter.fromDate) where.fromTime.gte = filter.fromDate
        if (filter.toDate) where.fromTime.lte = filter.toDate
      }

      const [shifts, total] = await Promise.all([
        prisma.shiftWorking.findMany({
          skip,
          take,
          where,
          include: {
            staff: {
              include: {
                account: true,
                positions: {
                  include: {
                    position: true
                  }
                }
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
          orderBy: { fromTime: 'asc' }
        }),
        prisma.shiftWorking.count({ where })
      ])

      return this.formatPaginationResult(shifts, total, page, limit)
    } catch (error) {
      this.handleError(error, 'getShifts')
    }
  }

  async getShiftsByDoctor(staffId: string, fromDate?: Date, toDate?: Date, page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        include: {
          account: true,
          positions: {
            include: {
              position: true
            }
          }
        }
      })
      if (!staff) {
        throw new Error('Doctor not found')
      }

      const where: any = { staffId }
      if (fromDate || toDate) {
        where.fromTime = {}
        if (fromDate) where.fromTime.gte = fromDate
        if (toDate) where.fromTime.lte = toDate
      }

      const [shifts, total] = await Promise.all([
        prisma.shiftWorking.findMany({
          skip,
          take,
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
          orderBy: { fromTime: 'asc' }
        }),
        prisma.shiftWorking.count({ where })
      ])

      const totalHours = this.calculateTotalHours(shifts)
      const totalDays = this.calculateWorkingDays(shifts)

      return {
        ...this.formatPaginationResult(shifts, total, page, limit),
        staff,
        totalHours: Math.round(totalHours * 100) / 100,
        totalDays,
        averageHoursPerDay: totalDays > 0 ? Math.round((totalHours / totalDays) * 100) / 100 : 0
      }
    } catch (error) {
      this.handleError(error, 'getShiftsByDoctor')
    }
  }

  async getShiftsByRoom(roomId: string, fromDate?: Date, toDate?: Date, page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      const room = await prisma.medicalRoom.findUnique({
        where: { id: roomId },
        include: {
          department: {
            include: {
              location: true
            }
          },
          service: true
        }
      })
      if (!room) {
        throw new Error('Room not found')
      }

      const where: any = { roomId }
      if (fromDate || toDate) {
        where.fromTime = {}
        if (fromDate) where.fromTime.gte = fromDate
        if (toDate) where.fromTime.lte = toDate
      }

      const [shifts, total] = await Promise.all([
        prisma.shiftWorking.findMany({
          skip,
          take,
          where,
          include: {
            staff: {
              include: {
                account: true,
                positions: {
                  include: {
                    position: true
                  }
                }
              }
            }
          },
          orderBy: { fromTime: 'asc' }
        }),
        prisma.shiftWorking.count({ where })
      ])

      const coverage = this.calculateRoomCoverage(shifts, fromDate, toDate)
      const uniqueDoctors = [...new Set(shifts.map((shift) => shift.staffId))].length

      return {
        ...this.formatPaginationResult(shifts, total, page, limit),
        room,
        coverage,
        uniqueDoctors,
        totalShifts: shifts.length
      }
    } catch (error) {
      this.handleError(error, 'getShiftsByRoom')
    }
  }

  async getShiftsByDepartment(
    departmentId: string,
    fromDate?: Date,
    toDate?: Date,
    page: number = 1,
    limit: number = 10
  ) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      const department = await prisma.department.findUnique({
        where: { id: departmentId },
        include: {
          location: true
        }
      })
      if (!department) {
        throw new Error('Department not found')
      }

      const where: any = {
        room: {
          departmentId: departmentId
        }
      }
      if (fromDate || toDate) {
        where.fromTime = {}
        if (fromDate) where.fromTime.gte = fromDate
        if (toDate) where.fromTime.lte = toDate
      }

      const [shifts, total] = await Promise.all([
        prisma.shiftWorking.findMany({
          skip,
          take,
          where,
          include: {
            staff: {
              include: {
                account: true,
                positions: {
                  include: {
                    position: true
                  }
                }
              }
            },
            room: {
              include: {
                service: true
              }
            }
          },
          orderBy: { fromTime: 'asc' }
        }),
        prisma.shiftWorking.count({ where })
      ])

      const uniqueDoctors = [...new Set(shifts.map((shift) => shift.staffId))].length
      const uniqueRooms = [...new Set(shifts.map((shift) => shift.roomId))].length
      const totalHours = this.calculateTotalHours(shifts)

      const roomShifts: { [roomId: string]: any } = {}
      shifts.forEach((shift) => {
        const roomId = shift.roomId
        if (!roomShifts[roomId]) {
          roomShifts[roomId] = {
            room: shift.room,
            shifts: [],
            totalHours: 0,
            doctors: new Set()
          }
        }
        roomShifts[roomId].shifts.push(shift)
        roomShifts[roomId].totalHours += this.calculateShiftDuration(shift.fromTime, shift.toTime)
        roomShifts[roomId].doctors.add(shift.staffId)
      })

      Object.keys(roomShifts).forEach((roomId) => {
        roomShifts[roomId].doctorCount = roomShifts[roomId].doctors.size
        roomShifts[roomId].totalHours = Math.round(roomShifts[roomId].totalHours * 100) / 100
        delete roomShifts[roomId].doctors
      })

      return {
        ...this.formatPaginationResult(shifts, total, page, limit),
        department,
        statistics: {
          uniqueDoctors,
          uniqueRooms,
          totalHours: Math.round(totalHours * 100) / 100,
          averageHoursPerRoom: uniqueRooms > 0 ? Math.round((totalHours / uniqueRooms) * 100) / 100 : 0
        },
        roomBreakdown: roomShifts
      }
    } catch (error) {
      this.handleError(error, 'getShiftsByDepartment')
    }
  }

  async getShiftsByDateRange(fromDate: Date, toDate: Date, page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      const where: any = {
        fromTime: {
          gte: fromDate,
          lte: toDate
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
                account: true,
                positions: {
                  include: {
                    position: true
                  }
                }
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
          orderBy: { fromTime: 'asc' }
        }),
        prisma.shiftWorking.count({ where })
      ])

      return this.formatPaginationResult(shifts, total, page, limit)
    } catch (error) {
      this.handleError(error, 'getShiftsByDateRange')
    }
  }

  async getShiftsByStaff(staffId: string, fromDate?: Date, toDate?: Date, page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        include: {
          account: true,
          positions: {
            include: {
              position: true
            }
          }
        }
      })
      if (!staff) {
        throw new Error('Staff not found')
      }

      const where: any = { staffId }
      if (fromDate || toDate) {
        where.fromTime = {}
        if (fromDate) where.fromTime.gte = fromDate
        if (toDate) where.fromTime.lte = toDate
      }

      const [shifts, total] = await Promise.all([
        prisma.shiftWorking.findMany({
          skip,
          take,
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
          orderBy: { fromTime: 'asc' }
        }),
        prisma.shiftWorking.count({ where })
      ])

      return this.formatPaginationResult(shifts, total, page, limit)
    } catch (error) {
      this.handleError(error, 'getShiftsByStaff')
    }
  }

  async createBulkShifts(data: BulkShiftData): Promise<ShiftWorking[]> {
    try {
      const shifts: CreateShiftData[] = []

      for (const date of data.dates) {
        if (data.morningShift) {
          const morningStart = new Date(date)
          morningStart.setHours(data.morningShift.startHour, 0, 0, 0)

          const morningEnd = new Date(date)
          morningEnd.setHours(data.morningShift.endHour, 0, 0, 0)

          shifts.push({
            staffId: data.staffId,
            roomId: data.roomId,
            fromTime: morningStart,
            toTime: morningEnd
          })
        }

        if (data.afternoonShift) {
          const afternoonStart = new Date(date)
          afternoonStart.setHours(data.afternoonShift.startHour, 0, 0, 0)

          const afternoonEnd = new Date(date)
          afternoonEnd.setHours(data.afternoonShift.endHour, 0, 0, 0)

          shifts.push({
            staffId: data.staffId,
            roomId: data.roomId,
            fromTime: afternoonStart,
            toTime: afternoonEnd
          })
        }
      }

      const createdShifts: ShiftWorking[] = []
      for (const shiftData of shifts) {
        try {
          const shift = await this.createShift(shiftData)
          createdShifts.push(shift)
        } catch (error: any) {
          console.warn(`Failed to create shift for ${shiftData.fromTime}: ${error.message}`)
        }
      }

      return createdShifts
    } catch (error) {
      this.handleError(error, 'createBulkShifts')
    }
  }

  async createRecurringShifts(data: RecurringShiftData): Promise<ShiftWorking[]> {
    try {
      const shifts: CreateShiftData[] = []
      const currentDate = new Date(data.startDate)
      const endDate = new Date(data.endDate)

      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay()

        if (data.daysOfWeek.includes(dayOfWeek)) {
          for (const timeSlot of data.timeSlots) {
            const fromTime = new Date(currentDate)
            fromTime.setHours(timeSlot.startHour, 0, 0, 0)

            const toTime = new Date(currentDate)
            toTime.setHours(timeSlot.endHour, 0, 0, 0)

            shifts.push({
              staffId: data.staffId,
              roomId: data.roomId,
              fromTime,
              toTime
            })
          }
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      const createdShifts: ShiftWorking[] = []
      for (const shiftData of shifts) {
        try {
          const shift = await this.createShift(shiftData)
          createdShifts.push(shift)
        } catch (error: any) {
          console.warn(`Failed to create shift for ${shiftData.fromTime}: ${error.message}`)
        }
      }

      return createdShifts
    } catch (error) {
      this.handleError(error, 'createRecurringShifts')
    }
  }

  async getShiftStatistics(filter: ShiftFilter = {}) {
    try {
      const where: any = {}

      if (filter.staffId) where.staffId = filter.staffId
      if (filter.departmentId) {
        where.room = {
          departmentId: filter.departmentId
        }
      }

      if (filter.fromDate || filter.toDate) {
        where.fromTime = {}
        if (filter.fromDate) where.fromTime.gte = filter.fromDate
        if (filter.toDate) where.fromTime.lte = filter.toDate
      }

      const [totalShifts, shifts, upcomingShifts, pastShifts] = await Promise.all([
        prisma.shiftWorking.count({ where }),
        prisma.shiftWorking.findMany({
          where,
          select: { staffId: true, roomId: true, fromTime: true, toTime: true }
        }),
        prisma.shiftWorking.count({
          where: {
            ...where,
            fromTime: { gte: new Date() }
          }
        }),
        prisma.shiftWorking.count({
          where: {
            ...where,
            toTime: { lt: new Date() }
          }
        })
      ])

      const uniqueDoctors = [...new Set(shifts.map((s) => s.staffId))].length
      const uniqueRooms = [...new Set(shifts.map((s) => s.roomId))].length
      const totalHours = this.calculateTotalHours(shifts)
      const averageShiftsPerDoctor = uniqueDoctors > 0 ? totalShifts / uniqueDoctors : 0

      return {
        totalShifts,
        upcomingShifts,
        pastShifts,
        uniqueDoctors,
        uniqueRooms,
        totalHours: Math.round(totalHours * 100) / 100,
        averageShiftsPerDoctor: Math.round(averageShiftsPerDoctor * 100) / 100
      }
    } catch (error) {
      this.handleError(error, 'getShiftStatistics')
    }
  }

  async checkShiftConflicts(staffId: string, fromTime: Date, toTime: Date, excludeShiftId?: string) {
    try {
      const where: any = {
        staffId: staffId,
        AND: [{ fromTime: { lt: toTime } }, { toTime: { gt: fromTime } }]
      }

      if (excludeShiftId) {
        where.id = { not: excludeShiftId }
      }

      const conflicts = await prisma.shiftWorking.findMany({
        where,
        include: {
          room: {
            include: {
              department: true,
              service: true
            }
          }
        }
      })

      return conflicts.map((conflict) => ({
        id: conflict.id,
        staffId: conflict.staffId,
        roomId: conflict.roomId,
        fromTime: conflict.fromTime,
        toTime: conflict.toTime,
        room: conflict.room,
        conflictType: 'doctor_schedule',
        message: `Doctor already has a shift from ${conflict.fromTime.toISOString()} to ${conflict.toTime.toISOString()}`
      }))
    } catch (error) {
      this.handleError(error, 'checkShiftConflicts')
    }
  }

  async assignShift(staffId: string, roomId: string, fromTime: Date, toTime: Date): Promise<ShiftWorking> {
    try {
      const existingShift = await prisma.shiftWorking.findFirst({
        where: {
          OR: [
            { staffId: staffId, AND: [{ fromTime: { lt: toTime } }, { toTime: { gt: fromTime } }] },
            { roomId: roomId, AND: [{ fromTime: { lt: toTime } }, { toTime: { gt: fromTime } }] }
          ]
        }
      })
      if (existingShift) {
        throw new Error('Shift already exists for this staff or room at the specified time')
      }
      const shiftData: Prisma.ShiftWorkingCreateInput = {
        staff: { connect: { id: staffId } },
        room: { connect: { id: roomId } },
        fromTime,
        toTime
      }
      const createdShiftWorking = await prisma.shiftWorking.create({
        data: shiftData,
        include: {
          staff: {
            include: {
              account: true
            }
          },
          room: {
            include: {
              department: true,
              service: true
            }
          }
        }
      })
      return createdShiftWorking
    } catch (error) {
      this.handleError(error, 'assignShift')
    }
  }

  private calculateTotalHours(shifts: any[]): number {
    return shifts.reduce((total, shift) => {
      return total + this.calculateShiftDuration(shift.fromTime, shift.toTime)
    }, 0)
  }

  private calculateShiftDuration(fromTime: Date, toTime: Date): number {
    const diffMs = new Date(toTime).getTime() - new Date(fromTime).getTime()
    return diffMs / (1000 * 60 * 60)
  }

  private calculateWorkingDays(shifts: any[]): number {
    const uniqueDates = new Set(shifts.map((shift) => new Date(shift.fromTime).toDateString()))
    return uniqueDates.size
  }

  private calculateRoomCoverage(shifts: any[], fromDate?: Date, toDate?: Date): any {
    if (!fromDate || !toDate) {
      return { coveragePercentage: 0, hoursPerDay: {} }
    }

    const totalDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
    const workingHoursPerDay = 8
    const totalPossibleHours = totalDays * workingHoursPerDay

    const actualHours = this.calculateTotalHours(shifts)
    const coveragePercentage = totalPossibleHours > 0 ? (actualHours / totalPossibleHours) * 100 : 0

    const hoursPerDay: { [date: string]: number } = {}
    shifts.forEach((shift) => {
      const date = new Date(shift.fromTime).toDateString()
      const duration = this.calculateShiftDuration(shift.fromTime, shift.toTime)
      hoursPerDay[date] = (hoursPerDay[date] || 0) + duration
    })

    return {
      coveragePercentage: Math.round(coveragePercentage * 100) / 100,
      actualHours: Math.round(actualHours * 100) / 100,
      totalPossibleHours,
      hoursPerDay
    }
  }
}
