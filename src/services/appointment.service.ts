import { Appointment, APPOINTMENTSTATUS, DiagnosisSuggestion, MedicalRoomTime } from '@prisma/client'
import prisma from '~/libs/prisma/init'

export default class AppointmentService {
  private static instance: AppointmentService
  private constructor() {}

  static getInstance() {
    if (!AppointmentService.instance) {
      AppointmentService.instance = new AppointmentService()
    }
    return AppointmentService.instance
  }

  async createAppointment(data: {
    userId: string
    medicalRoomId: string
    medicalRoomTimeId: string
    patientId: string
  }): Promise<Appointment> {
    // First create the booking time
    const booking = await prisma.bookingTime.create({
      data: {
        medicalRoomTimeId: data.medicalRoomTimeId,
        userAccountId: data.patientId
      }
    })

    return await prisma.appointment.create({
      data: {
        userId: data.userId,
        medicalRoomId: data.medicalRoomId,
        bookingTimeId: booking.id,
        patientId: data.patientId,
        status: APPOINTMENTSTATUS.BOOKED,
        statusLogs: {
          create: {
            status: APPOINTMENTSTATUS.BOOKED
          }
        }
      }
    })
  }

  async updateAppointmentStatus(appointmentId: string, status: APPOINTMENTSTATUS): Promise<Appointment> {
    // Update appointment status
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status,
        statusLogs: {
          create: {
            status
          }
        }
      }
    })

    return updatedAppointment
  }

  async getAppointmentById(id: string): Promise<Appointment | null> {
    return await prisma.appointment.findUnique({
      where: { id },
      include: {
        user: true,
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
          orderBy: {
            updatedAt: 'desc'
          }
        }
      }
    })
  }

  async addDiagnosisSuggestion(data: {
    appointmentId: string
    suggestedByAI: boolean
    diseaseId?: string
    disease?: string
    confidence: number
  }): Promise<DiagnosisSuggestion> {
    return await prisma.diagnosisSuggestion.create({
      data: {
        appointmentId: data.appointmentId,
        suggestedByAI: data.suggestedByAI ? 'TRUE' : 'FALSE',
        disease: data.disease,
        confidence: data.confidence
      }
    })
  }

  async getAvailableTimeSlots(medicalRoomId: string, date: Date): Promise<MedicalRoomTime[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Get all time slots for the medical room
    const timeSlots = await prisma.medicalRoomTime.findMany({
      where: {
        roomId: medicalRoomId,
        fromTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: {
        fromTime: 'asc'
      },
      include: {
        bookings: true
      }
    })

    // Filter to only available slots (those without bookings)
    return timeSlots.filter((slot: any) => slot.bookings.length === 0)
  }
}
