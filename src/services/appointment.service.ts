import { Appointment, APPOINTMENTSTATUS, DiagnosisSuggestion, BookingTime, Prisma } from '@prisma/client'
import BaseService from './base.service'
import prisma from '~/libs/prisma/init'

export interface CreateAppointmentData {
  userId: string
  patientId: string
  medicalRoomTimeId: string
  notes?: string
}

export interface AppointmentFilter {
  userId?: string
  staffId?: string
  departmentId?: string
  status?: APPOINTMENTSTATUS
  date?: Date
  fromDate?: Date
  toDate?: Date
}

export default class AppointmentService extends BaseService {
  private static instance: AppointmentService
  private constructor() {
    super()
  }
  static getInstance(): AppointmentService {
    if (!AppointmentService.instance) {
      AppointmentService.instance = new AppointmentService()
    }
    return AppointmentService.instance
  }
  async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    try {
      // Check if time slot exists and is available
      const timeSlot = await prisma.medicalRoomTime.findUnique({
        where: { id: data.medicalRoomTimeId },
        include: {
          room: true,
          bookings: true
        }
      })
      if (!timeSlot) {
        throw new Error('Time slot not found')
      }

      // Check if already booked
      if (timeSlot.bookings && timeSlot.bookings.length > 0) {
        throw new Error('Time slot is already booked')
      }

      // Check if appointment time is in the future
      if (timeSlot.fromTime <= new Date()) {
        throw new Error('Cannot book appointments in the past')
      }

      // Create booking time
      const bookingData: Prisma.BookingTimeCreateInput = {
        medicalRoomTime: { connect: { id: data.medicalRoomTimeId } },
        user: { connect: { id: data.userId } },
        patient: { connect: { id: data.patientId } }
      }

      const booking = await prisma.bookingTime.create({
        data: bookingData
      })

      // Create appointment
      const appointmentData: Prisma.AppointmentCreateInput = {
        medicalRoom: { connect: { id: timeSlot.roomId } },
        user: { connect: { id: data.userId } },
        bookingTime: { connect: { id: booking.id } },
        patient: { connect: { id: data.patientId } },
        status: APPOINTMENTSTATUS.BOOKED
      }

      const appointment = await prisma.appointment.create({
        data: appointmentData
      })

      // Create status log
      await prisma.appointmentStatusLog.create({
        data: {
          appointmentId: appointment.id,
          status: APPOINTMENTSTATUS.BOOKED
        }
      })

      return appointment
    } catch (error) {
      this.handleError(error, 'createAppointment')
    }
  }

  async updateAppointmentStatus(
    appointmentId: string,
    status: APPOINTMENTSTATUS,
    reason?: string
  ): Promise<Appointment> {
    try {
      // Update appointment status
      const appointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status }
      })

      // Create status log
      await prisma.appointmentStatusLog.create({
        data: {
          appointmentId: appointmentId,
          status
        }
      })

      return appointment
    } catch (error) {
      this.handleError(error, 'updateAppointmentStatus')
    }
  }

  async cancelAppointment(appointmentId: string, reason: string): Promise<Appointment> {
    try {
      return await this.updateAppointmentStatus(appointmentId, APPOINTMENTSTATUS.CANCEL, reason)
    } catch (error) {
      this.handleError(error, 'cancelAppointment')
    }
  }

  async completeAppointment(appointmentId: string): Promise<Appointment> {
    try {
      return await this.updateAppointmentStatus(appointmentId, APPOINTMENTSTATUS.PAID)
    } catch (error) {
      this.handleError(error, 'completeAppointment')
    }
  }

  async getAppointmentById(id: string) {
    try {
      return await prisma.appointment.findUnique({
        where: { id },
        include: {
          user: {
            include: {
              account: true
            }
          },
          patient: true,
          medicalRoom: {
            include: {
              service: true,
              department: {
                include: {
                  location: true
                }
              }
            }
          },
          bookingTime: {
            include: {
              medicalRoomTime: true
            }
          },
          statusLogs: {
            orderBy: { updatedAt: 'desc' }
          },
          suggestions: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })
    } catch (error) {
      this.handleError(error, 'getAppointmentById')
    }
  }

  async getAppointments(filter: AppointmentFilter = {}, page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      const where: any = {}

      if (filter.userId) where.userId = filter.userId
      if (filter.status) where.status = filter.status

      if (filter.departmentId) {
        where.medicalRoom = {
          departmentId: filter.departmentId
        }
      }

      if (filter.date) {
        const startOfDay = new Date(filter.date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(filter.date)
        endOfDay.setHours(23, 59, 59, 999)

        where.bookingTime = {
          medicalRoomTime: {
            fromTime: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        }
      } else if (filter.fromDate || filter.toDate) {
        where.bookingTime = {
          medicalRoomTime: {
            fromTime: {}
          }
        }
        if (filter.fromDate) where.bookingTime.medicalRoomTime.fromTime.gte = filter.fromDate
        if (filter.toDate) where.bookingTime.medicalRoomTime.fromTime.lte = filter.toDate
      }

      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          skip,
          take,
          where,
          include: {
            user: {
              include: {
                account: true
              }
            },
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
        }),
        prisma.appointment.count({ where })
      ])

      return this.formatPaginationResult(appointments, total, page, limit)
    } catch (error) {
      this.handleError(error, 'getAppointments')
    }
  }

  async getAppointmentsByStaff(staffId: string, date?: Date, page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      // Get appointments in rooms where this staff is working
      const where: any = {
        medicalRoom: {
          shifts: {
            some: {
              doctorId: staffId
            }
          }
        }
      }

      if (date) {
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        where.bookingTime = {
          medicalRoomTime: {
            fromTime: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        }

        // Also filter shifts for the same date
        where.medicalRoom.shifts.some.fromTime = {
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
            },
            statusLogs: {
              orderBy: { updatedAt: 'desc' }
            }
          }
        }),
        prisma.appointment.count({ where })
      ])

      return this.formatPaginationResult(appointments, total, page, limit)
    } catch (error) {
      this.handleError(error, 'getAppointmentsByStaff')
    }
  }

  async getPatientAppointmentHistory(
    patientId: string,
    page: number = 1,
    limit: number = 10,
    status?: APPOINTMENTSTATUS
  ) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      const where = { patientId }

      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          skip,
          take,
          where,
          include: {
            medicalRoom: {
              include: {
                service: true,
                department: {
                  include: {
                    location: true
                  }
                }
              }
            },
            bookingTime: {
              include: {
                medicalRoomTime: true
              }
            },
            statusLogs: {
              orderBy: { updatedAt: 'desc' }
            },
            suggestions: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }),
        prisma.appointment.count({ where })
      ])

      return this.formatPaginationResult(appointments, total, page, limit)
    } catch (error) {
      this.handleError(error, 'getPatientAppointmentHistory')
    }
  }

  async getUpcomingAppointments(userId: string, limit: number = 5) {
    try {
      const where = {
        patient: {
          userId: userId
        },
        status: {
          in: [APPOINTMENTSTATUS.BOOKED, APPOINTMENTSTATUS.PAID]
        },
        bookingTime: {
          medicalRoomTime: {
            fromTime: {
              gte: new Date()
            }
          }
        }
      }

      const include = {
        patient: true,
        medicalRoom: {
          include: {
            service: true,
            department: {
              include: {
                location: true
              }
            }
          }
        },
        bookingTime: {
          include: {
            medicalRoomTime: true
          }
        }
      }

      return await prisma.appointment.findMany({
        where,
        include,
        take: limit
      })
    } catch (error) {
      this.handleError(error, 'getUpcomingAppointments')
    }
  }

  async addDiagnosisSuggestion(data: {
    appointmentId: string
    suggestedByAI: boolean
    disease: string
    confidence: number
    description?: string
  }): Promise<DiagnosisSuggestion> {
    try {
      const suggestionData: Prisma.DiagnosisSuggestionCreateInput = {
        appointment: { connect: { id: data.appointmentId } },
        suggestedByAI: data.suggestedByAI ? 'TRUE' : 'FALSE',
        disease: data.disease,
        confidence: data.confidence,
        description: data.description
      }

      return await prisma.diagnosisSuggestion.create({
        data: suggestionData
      })
    } catch (error) {
      this.handleError(error, 'addDiagnosisSuggestion')
    }
  }

  async getAppointmentStatistics(filter: AppointmentFilter = {}) {
    try {
      const where: any = {}

      if (filter.departmentId) {
        where.medicalRoom = {
          departmentId: filter.departmentId
        }
      }

      if (filter.fromDate || filter.toDate) {
        where.bookingTime = {
          medicalRoomTime: {
            fromTime: {}
          }
        }
        if (filter.fromDate) where.bookingTime.medicalRoomTime.fromTime.gte = filter.fromDate
        if (filter.toDate) where.bookingTime.medicalRoomTime.fromTime.lte = filter.toDate
      }

      const [total, booked, paid, cancelled] = await Promise.all([
        prisma.appointment.count({ where }),
        prisma.appointment.count({
          where: {
            ...where,
            status: APPOINTMENTSTATUS.BOOKED
          }
        }),
        prisma.appointment.count({
          where: { ...where, status: APPOINTMENTSTATUS.PAID }
        }),
        prisma.appointment.count({
          where: { ...where, status: APPOINTMENTSTATUS.CANCEL }
        })
      ])

      const completionRate = total > 0 ? (paid / total) * 100 : 0
      const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0

      return {
        total,
        booked,
        paid,
        cancelled,
        completionRate: Math.round(completionRate * 100) / 100,
        cancellationRate: Math.round(cancellationRate * 100) / 100
      }
    } catch (error) {
      this.handleError(error, 'getAppointmentStatistics')
    }
  }

  async checkTimeSlotAvailability(medicalRoomTimeId: string): Promise<boolean> {
    try {
      const bookingCount = await prisma.bookingTime.count({
        where: {
          medicalRoomTimeId: medicalRoomTimeId
        }
      })

      return bookingCount === 0
    } catch (error) {
      this.handleError(error, 'checkTimeSlotAvailability')
    }
  }
}
