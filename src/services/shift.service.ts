import prisma from '~/libs/prisma/init'
import { ShiftWorking } from '~/generated/prisma/client'

export default class ShiftService {
  private static instance: ShiftService
  private constructor() {}

  static getInstance() {
    if (!ShiftService.instance) {
      ShiftService.instance = new ShiftService()
    }
    return ShiftService.instance
  }

  async createShift(data: { doctorId: string; roomId: string; fromTime: Date; toTime: Date }): Promise<ShiftWorking> {
    return prisma.shiftWorking.create({
      data
    })
  }

  async updateShift(
    id: string,
    data: {
      doctorId?: string
      roomId?: string
      fromTime?: Date
      toTime?: Date
    }
  ): Promise<ShiftWorking> {
    return prisma.shiftWorking.update({
      where: { id },
      data
    })
  }

  async deleteShift(id: string): Promise<ShiftWorking> {
    return prisma.shiftWorking.delete({
      where: { id }
    })
  }

  async getShiftById(id: string) {
    return prisma.shiftWorking.findUnique({
      where: { id },
      include: {
        doctor: true,
        room: {
          include: {
            department: true,
            service: true
          }
        }
      }
    })
  }

  async getShiftsByRoomId(roomId: string, fromDate?: Date, toDate?: Date) {
    const dateFilter: any = {}

    if (fromDate) {
      dateFilter['gte'] = fromDate
    }

    if (toDate) {
      dateFilter['lte'] = toDate
    }

    const whereClause: any = { roomId }
    if (Object.keys(dateFilter).length > 0) {
      whereClause.fromTime = dateFilter
    }

    return prisma.shiftWorking.findMany({
      where: whereClause,
      include: {
        doctor: {
          include: {
            positions: {
              include: {
                position: true
              }
            }
          }
        }
      },
      orderBy: {
        fromTime: 'asc'
      }
    })
  }

  async getShiftsByDepartment(departmentId: string, fromDate?: Date, toDate?: Date) {
    // First get all rooms in the department
    const rooms = await prisma.medicalRoom.findMany({
      where: { departmentId },
      select: { id: true }
    })

    const roomIds = rooms.map((room) => room.id)

    const dateFilter: any = {}

    if (fromDate) {
      dateFilter['gte'] = fromDate
    }

    if (toDate) {
      dateFilter['lte'] = toDate
    }

    const whereClause: any = {
      roomId: { in: roomIds }
    }

    if (Object.keys(dateFilter).length > 0) {
      whereClause.fromTime = dateFilter
    }

    return prisma.shiftWorking.findMany({
      where: whereClause,
      include: {
        doctor: {
          include: {
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
      orderBy: {
        fromTime: 'asc'
      }
    })
  }
}
