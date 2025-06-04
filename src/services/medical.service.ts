import { MedicalRoom, MedicalRoomTime, Service, Department, Prisma } from '@prisma/client'
import { BaseService } from './base.service'
import prisma from '~/libs/prisma/init'

export interface CreateMedicalRoomData {
  departmentId: string
  serviceId: string
  floor: number
  name: string
}

export interface UpdateMedicalRoomData {
  departmentId?: string
  serviceId?: string
  floor?: number
  name?: string
}

export interface CreateTimeSlotData {
  roomId: string
  fromTime: Date
  toTime: Date
}

export interface MedicalRoomFilter {
  departmentId?: string
  serviceId?: string
  floor?: number
  available?: boolean
  searchTerm?: string
}

export interface TimeSlotFilter {
  roomId?: string
  departmentId?: string
  date?: Date
  fromTime?: Date
  toTime?: Date
  available?: boolean
}

export default class MedicalService extends BaseService {
  private static instance: MedicalService
  private constructor() {
    super()
  }
  static getInstance(): MedicalService {
    if (!MedicalService.instance) {
      MedicalService.instance = new MedicalService()
    }
    return MedicalService.instance
  }
  // Medical Room Management
  async createMedicalRoom(data: CreateMedicalRoomData): Promise<MedicalRoom> {
    try {
      // Validate department exists
      const department = await prisma.department.findUnique({
        where: { id: data.departmentId }
      })
      if (!department) {
        throw new Error('Department not found')
      }

      // Validate service exists
      const service = await prisma.service.findUnique({
        where: { id: data.serviceId }
      })
      if (!service) {
        throw new Error('Service not found')
      }

      // Check if room name is unique within department
      const existingRoom = await prisma.medicalRoom.findFirst({
        where: {
          name: data.name,
          departmentId: data.departmentId
        }
      })
      if (existingRoom) {
        throw new Error('Room name already exists in this department')
      }

      const roomData: Prisma.MedicalRoomCreateInput = {
        department: { connect: { id: data.departmentId } },
        service: { connect: { id: data.serviceId } },
        floor: data.floor,
        name: data.name
      }

      return await prisma.medicalRoom.create({
        data: roomData
      })
    } catch (error) {
      this.handleError(error, 'createMedicalRoom')
    }
  }

  async updateMedicalRoom(id: string, data: UpdateMedicalRoomData): Promise<MedicalRoom> {
    try {
      const existingRoom = await prisma.medicalRoom.findUnique({
        where: { id }
      })
      if (!existingRoom) {
        throw new Error('Medical room not found')
      }

      // Validate department if changing
      if (data.departmentId && data.departmentId !== existingRoom.departmentId) {
        const department = await prisma.department.findUnique({
          where: { id: data.departmentId }
        })
        if (!department) {
          throw new Error('Department not found')
        }
      }

      // Validate service if changing
      if (data.serviceId && data.serviceId !== existingRoom.serviceId) {
        const service = await prisma.service.findUnique({
          where: { id: data.serviceId }
        })
        if (!service) {
          throw new Error('Service not found')
        }
      }

      // Check name uniqueness if changing
      if (data.name && data.name !== existingRoom.name) {
        const departmentId = data.departmentId || existingRoom.departmentId
        const nameExists = await prisma.medicalRoom.findFirst({
          where: {
            name: data.name,
            departmentId
          }
        })
        if (nameExists && nameExists.id !== id) {
          throw new Error('Room name already exists in this department')
        }
      }

      const updateData: Prisma.MedicalRoomUpdateInput = {
        department: data.departmentId ? { connect: { id: data.departmentId } } : undefined,
        service: data.serviceId ? { connect: { id: data.serviceId } } : undefined,
        floor: data.floor,
        name: data.name
      }

      return await prisma.medicalRoom.update({
        where: { id },
        data: updateData
      })
    } catch (error) {
      this.handleError(error, 'updateMedicalRoom')
    }
  }

  async getMedicalRoomById(id: string) {
    try {
      return await prisma.medicalRoom.findUnique({
        where: { id },
        include: {
          department: {
            include: {
              location: true
            }
          },
          service: true
        }
      })
    } catch (error) {
      this.handleError(error, 'getMedicalRoomById')
    }
  }

  async getMedicalRooms(filter: MedicalRoomFilter = {}, page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      const where: any = {}

      if (filter.departmentId) where.departmentId = filter.departmentId
      if (filter.serviceId) where.serviceId = filter.serviceId
      if (filter.floor !== undefined) where.floor = filter.floor

      if (filter.searchTerm) {
        where.OR = [
          { name: { contains: filter.searchTerm, mode: 'insensitive' } },
          { department: { name: { contains: filter.searchTerm, mode: 'insensitive' } } },
          { service: { name: { contains: filter.searchTerm, mode: 'insensitive' } } }
        ]
      }

      const [rooms, total] = await Promise.all([
        prisma.medicalRoom.findMany({
          skip,
          take,
          where,
          include: {
            department: {
              include: {
                location: true
              }
            },
            service: true,
            _count: {
              select: {
                times: true,
                shifts: true
              }
            }
          }
        }),
        prisma.medicalRoom.count({ where })
      ])

      return this.formatPaginationResult(rooms, total, page, limit)
    } catch (error) {
      this.handleError(error, 'getMedicalRooms')
    }
  }

  async deleteMedicalRoom(id: string): Promise<void> {
    try {
      const room = await prisma.medicalRoom.findUnique({
        where: { id }
      })
      if (!room) {
        throw new Error('Medical room not found')
      }

      // Check if room has active time slots
      const activeTimeSlots = await prisma.medicalRoomTime.count({
        where: {
          roomId: id,
          fromTime: { gte: new Date() }
        }
      })

      if (activeTimeSlots > 0) {
        throw new Error('Cannot delete room with active time slots. Delete time slots first.')
      }

      await prisma.medicalRoom.delete({
        where: { id }
      })
    } catch (error) {
      this.handleError(error, 'deleteMedicalRoom')
    }
  }

  // Time Slot Management
  async createTimeSlot(data: CreateTimeSlotData): Promise<MedicalRoomTime> {
    try {
      // Validate room exists
      const room = await prisma.medicalRoom.findUnique({
        where: { id: data.roomId }
      })
      if (!room) {
        throw new Error('Medical room not found')
      }

      // Validate time slot
      if (data.fromTime >= data.toTime) {
        throw new Error('Start time must be before end time')
      }

      if (data.fromTime <= new Date()) {
        throw new Error('Cannot create time slots in the past')
      }

      // Check for overlapping time slots
      const overlapping = await prisma.medicalRoomTime.findMany({
        where: {
          roomId: data.roomId,
          AND: [{ fromTime: { lt: data.toTime } }, { toTime: { gt: data.fromTime } }]
        }
      })
      if (overlapping.length > 0) {
        throw new Error('Time slot overlaps with existing time slot')
      }

      const timeSlotData: Prisma.MedicalRoomTimeCreateInput = {
        room: { connect: { id: data.roomId } },
        fromTime: data.fromTime,
        toTime: data.toTime
      }

      return await prisma.medicalRoomTime.create({
        data: timeSlotData
      })
    } catch (error) {
      this.handleError(error, 'createTimeSlot')
    }
  }

  async createBulkTimeSlots(
    roomId: string,
    dates: Date[],
    timeSlots: Array<{ startHour: number; endHour: number; slotDuration: number }>
  ): Promise<MedicalRoomTime[]> {
    try {
      const room = await prisma.medicalRoom.findUnique({
        where: { id: roomId }
      })
      if (!room) {
        throw new Error('Medical room not found')
      }

      const createdSlots: MedicalRoomTime[] = []

      for (const date of dates) {
        for (const timeSlot of timeSlots) {
          const currentHour = timeSlot.startHour
          const endHour = timeSlot.endHour

          let slotStart = currentHour
          while (slotStart < endHour) {
            const fromTime = new Date(date)
            fromTime.setHours(Math.floor(slotStart), (slotStart % 1) * 60, 0, 0)

            const toTime = new Date(date)
            const slotEnd = slotStart + timeSlot.slotDuration / 60
            toTime.setHours(Math.floor(slotEnd), (slotEnd % 1) * 60, 0, 0)

            try {
              const slot = await this.createTimeSlot({
                roomId,
                fromTime,
                toTime
              })
              createdSlots.push(slot)
            } catch (error: any) {
              console.warn(`Failed to create time slot ${fromTime.toISOString()}: ${error.message}`)
            }

            slotStart = slotEnd
          }
        }
      }

      return createdSlots
    } catch (error) {
      this.handleError(error, 'createBulkTimeSlots')
    }
  }

  async getTimeSlots(filter: TimeSlotFilter = {}, page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      const where: any = {}

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
      } else if (filter.fromTime || filter.toTime) {
        where.fromTime = {}
        if (filter.fromTime) where.fromTime.gte = filter.fromTime
        if (filter.toTime) where.fromTime.lte = filter.toTime
      }

      const [timeSlots, total] = await Promise.all([
        prisma.medicalRoomTime.findMany({
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
            },
            bookings: {
              include: {
                user: true,
                patient: true
              }
            }
          }
        }),
        prisma.medicalRoomTime.count({ where })
      ])

      // Filter for available slots if requested
      if (filter.available !== undefined) {
        const filteredSlots = timeSlots.filter((slot) => {
          const isBooked = slot.bookings && slot.bookings.length > 0
          return filter.available ? !isBooked : isBooked
        })

        return this.formatPaginationResult(filteredSlots, filteredSlots.length, page, limit)
      }

      return this.formatPaginationResult(timeSlots, total, page, limit)
    } catch (error) {
      this.handleError(error, 'getTimeSlots')
    }
  }

  async getAvailableTimeSlots(departmentId?: string, serviceId?: string, date?: Date) {
    try {
      const where: any = {
        fromTime: { gte: new Date() }
      }

      if (date) {
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        where.fromTime = {
          gte: startOfDay,
          lte: endOfDay
        }
      }

      if (departmentId) {
        where.room = {
          departmentId
        }
      }

      if (serviceId) {
        where.room = {
          ...where.room,
          serviceId
        }
      }

      const timeSlots = await prisma.medicalRoomTime.findMany({
        where,
        include: {
          room: {
            include: {
              department: true,
              service: true
            }
          },
          bookings: true
        }
      })

      // Filter out booked slots
      const availableSlots = timeSlots.filter((slot) => !slot.bookings || slot.bookings.length === 0)

      return availableSlots
    } catch (error) {
      this.handleError(error, 'getAvailableTimeSlots')
    }
  }

  async deleteTimeSlot(id: string): Promise<void> {
    try {
      const timeSlot = await prisma.medicalRoomTime.findUnique({
        where: { id }
      })
      if (!timeSlot) {
        throw new Error('Time slot not found')
      }

      // Check if time slot is booked
      const isBooked = await prisma.bookingTime.count({
        where: {
          medicalRoomTimeId: id
        }
      })

      if (isBooked > 0) {
        throw new Error('Cannot delete time slot that has bookings')
      }

      await prisma.medicalRoomTime.delete({
        where: { id }
      })
    } catch (error) {
      this.handleError(error, 'deleteTimeSlot')
    }
  }

  // Service Management
  async createService(name: string, description?: string): Promise<Service> {
    try {
      // Check if service name is unique
      const existing = await prisma.service.findFirst({
        where: { name }
      })
      if (existing) {
        throw new Error('Service name already exists')
      }

      const serviceData: Prisma.ServiceCreateInput = {
        name,
        description
      }

      return await prisma.service.create({
        data: serviceData
      })
    } catch (error) {
      this.handleError(error, 'createService')
    }
  }

  async updateService(id: string, name?: string, description?: string): Promise<Service> {
    try {
      const existing = await prisma.service.findUnique({
        where: { id }
      })
      if (!existing) {
        throw new Error('Service not found')
      }

      // Check name uniqueness if changing
      if (name && name !== existing.name) {
        const nameExists = await prisma.service.findFirst({
          where: { name }
        })
        if (nameExists) {
          throw new Error('Service name already exists')
        }
      }

      const updateData: Prisma.ServiceUpdateInput = {
        name,
        description
      }

      return await prisma.service.update({
        where: { id },
        data: updateData
      })
    } catch (error) {
      this.handleError(error, 'updateService')
    }
  }

  async getServices(page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      const [services, total] = await Promise.all([
        prisma.service.findMany({
          skip,
          take,
          where: {},
          include: {
            _count: {
              select: {
                medicalRooms: true
              }
            }
          }
        }),
        prisma.service.count()
      ])

      return this.formatPaginationResult(services, total, page, limit)
    } catch (error) {
      this.handleError(error, 'getServices')
    }
  }

  async deleteService(id: string): Promise<void> {
    try {
      const service = await prisma.service.findUnique({
        where: { id }
      })
      if (!service) {
        throw new Error('Service not found')
      }

      // Check if service has medical rooms
      const roomCount = await prisma.medicalRoom.count({ where: { serviceId: id } })
      if (roomCount > 0) {
        throw new Error('Cannot delete service with medical rooms. Remove rooms first.')
      }

      await prisma.service.delete({
        where: { id }
      })
    } catch (error) {
      this.handleError(error, 'deleteService')
    }
  }

  // Medical Statistics and Analytics
  async getMedicalStatistics(departmentId?: string) {
    try {
      const where: any = departmentId ? { departmentId } : {}

      await prisma.medicalRoomTime.count({})

      const [totalRooms, totalTimeSlots, bookedSlots, availableSlots, totalServices] = await Promise.all([
        prisma.medicalRoom.count(where),
        prisma.medicalRoomTime.count({
          where: {
            ...(departmentId ? { room: { departmentId } } : {})
          }
        }),
        prisma.medicalRoomTime.count({
          where: {
            ...(departmentId ? { room: { departmentId } } : {})
          }
        }),
        prisma.medicalRoomTime.count({
          where: {
            ...(departmentId ? { room: { departmentId } } : {}),
            fromTime: { gte: new Date() }
          }
        }),
        prisma.service.count()
      ])

      const utilizationRate = totalTimeSlots > 0 ? (bookedSlots / totalTimeSlots) * 100 : 0

      return {
        totalRooms,
        totalTimeSlots,
        bookedSlots,
        availableSlots,
        totalServices,
        utilizationRate: Math.round(utilizationRate * 100) / 100
      }
    } catch (error) {
      this.handleError(error, 'getMedicalStatistics')
    }
  }

  async getRoomUtilization(roomId: string, fromDate?: Date, toDate?: Date) {
    try {
      const room = await prisma.medicalRoom.findUnique({
        where: { id: roomId }
      })
      if (!room) {
        throw new Error('Medical room not found')
      }

      const where: any = { roomId }
      if (fromDate || toDate) {
        where.fromTime = {}
        if (fromDate) where.fromTime.gte = fromDate
        if (toDate) where.fromTime.lte = toDate
      }

      const [totalSlots, bookedSlots] = await Promise.all([
        prisma.medicalRoomTime.count(where),
        prisma.medicalRoomTime.count({
          ...where,
          BookingTime: { some: {} }
        })
      ])

      const utilizationRate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0

      return {
        roomId,
        roomName: room.name,
        totalSlots,
        bookedSlots,
        availableSlots: totalSlots - bookedSlots,
        utilizationRate: Math.round(utilizationRate * 100) / 100
      }
    } catch (error) {
      this.handleError(error, 'getRoomUtilization')
    }
  }

  async getServicePopularity(fromDate?: Date, toDate?: Date) {
    try {
      const where: any = {}
      if (fromDate || toDate) {
        where.BookingTime = {
          some: {
            createdAt: {}
          }
        }
        if (fromDate) where.BookingTime.some.createdAt.gte = fromDate
        if (toDate) where.BookingTime.some.createdAt.lte = toDate
      }

      const serviceUsage = await prisma.service.findMany({
        where: {},
        include: {
          _count: {
            select: {
              medicalRooms: {
                where: {
                  times: {
                    some: {
                      bookings: {
                        some: where.BookingTime ? where.BookingTime.some : {}
                      }
                    }
                  }
                }
              }
            }
          }
        }
      })

      return serviceUsage.sort((a: any, b: any) => b._count.medicalRooms - a._count.medicalRooms)
    } catch (error) {
      this.handleError(error, 'getServicePopularity')
    }
  }
}
