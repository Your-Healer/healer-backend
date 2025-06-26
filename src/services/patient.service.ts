import { Appointment, Patient, Prisma } from '@prisma/client'
import BaseService from './base.service'
import prisma from '~/libs/prisma/init'
import {
  CreatePatientDto,
  GetPatientAppointmentHistoryDto,
  GetPatientsByUserIdDto,
  GetPatientsDto,
  SearchPatientsDto,
  UpdatePatientDto
} from '~/dtos/patient.dto'

export default class PatientService extends BaseService {
  private static instance: PatientService
  private constructor() {
    super()
  }

  static getInstance(): PatientService {
    if (!PatientService.instance) {
      PatientService.instance = new PatientService()
    }
    return PatientService.instance
  }

  async createPatient(data: CreatePatientDto): Promise<Patient> {
    try {
      // Validate user exists
      const user = await prisma.user.findUnique({
        where: { id: data.userId }
      })
      if (!user) {
        throw new Error('User not found')
      }

      // Check if phone number is unique (if provided)
      if (data.phoneNumber) {
        const existingPatient = await prisma.patient.findMany({
          where: { phoneNumber: data.phoneNumber }
        })
        if (existingPatient.length > 0) {
          throw new Error('Phone number already exists for another patient')
        }
      }

      const patientData: Prisma.PatientCreateInput = {
        user: { connect: { id: data.userId } },
        firstname: data.firstname,
        lastname: data.lastname,
        phoneNumber: data.phoneNumber,
        address: data.address
      }

      return await prisma.patient.create({
        data: patientData
      })
    } catch (error) {
      this.handleError(error, 'createPatient')
    }
  }

  async updatePatient(id: string, data: UpdatePatientDto): Promise<Patient> {
    try {
      const existingPatient = await prisma.patient.findUnique({
        where: { id }
      })
      if (!existingPatient) {
        throw new Error('Patient not found')
      }

      // Check phone uniqueness if updating
      if (data.phoneNumber && data.phoneNumber !== existingPatient.phoneNumber) {
        const phoneExists = await prisma.patient.findMany({
          where: {
            phoneNumber: data.phoneNumber,
            NOT: { id: id }
          }
        })
        if (phoneExists.length > 0) {
          throw new Error('Phone number already exists for another patient')
        }
      }

      return await prisma.patient.update({
        where: { id },
        data: {
          firstname: data.firstname,
          lastname: data.lastname,
          phoneNumber: data.phoneNumber,
          address: data.address
        }
      })
    } catch (error) {
      this.handleError(error, 'updatePatient')
    }
  }

  async getPatientById(id: string) {
    try {
      return await prisma.patient.findUnique({
        where: { id },
        include: {
          user: {
            include: {
              account: true
            }
          },
          Appointment: {
            include: {
              medicalRoom: {
                include: {
                  service: true,
                  department: true
                }
              }
            }
          }
        }
      })
    } catch (error) {
      this.handleError(error, 'getPatientById')
    }
  }

  async getPatients(data: GetPatientsDto) {
    try {
      const { skip, take } = this.calculatePagination(data.page, data.limit)

      const where: any = {}

      if (data.filter.userId) where.userId = data.filter.userId
      if (data.filter.gender) where.gender = data.filter.gender
      if (data.filter.bloodType) where.bloodType = data.filter.bloodType

      if (data.filter.searchTerm) {
        where.OR = [
          { firstname: { contains: data.filter.searchTerm, mode: 'insensitive' } },
          { lastname: { contains: data.filter.searchTerm, mode: 'insensitive' } },
          { phoneNumber: { contains: data.filter.searchTerm, mode: 'insensitive' } },
          { address: { contains: data.filter.searchTerm, mode: 'insensitive' } },
          { user: { account: { email: { contains: data.filter.searchTerm, mode: 'insensitive' } } } }
        ]
      }

      if (data.filter.hasAppointments !== undefined) {
        if (data.filter.hasAppointments) {
          where.Appointment = { some: {} }
        } else {
          where.Appointment = { none: {} }
        }
      }

      const [patients, total] = await Promise.all([
        prisma.patient.findMany({
          skip,
          take,
          where,
          include: {
            user: {
              include: {
                account: true
              }
            },
            _count: {
              select: {
                Appointment: true,
                BookingTime: true
              }
            }
          }
        }),
        prisma.patient.count({ where })
      ])

      return this.formatPaginationResult(patients, total, data.page, data.limit)
    } catch (error) {
      this.handleError(error, 'getPatients')
    }
  }

  async getPatientsByUserId(data: GetPatientsByUserIdDto) {
    try {
      const { skip, take } = this.calculatePagination(data.page, data.limit)

      const patients = await prisma.patient.findMany({
        where: { userId: data.userId },
        skip,
        take,
        include: {
          user: {
            include: {
              account: true
            }
          }
        }
      })
      const total = await prisma.patient.count({ where: { userId: data.userId } })

      return this.formatPaginationResult(patients, total, data.page, data.limit)
    } catch (error) {
      this.handleError(error, 'getPatientsByUserId')
    }
  }

  async searchPatients(data: SearchPatientsDto) {
    try {
      const { skip, take } = this.calculatePagination(data.page, data.limit)

      const patients = await prisma.patient.findMany({
        where: {
          OR: [
            { firstname: { contains: data.searchTerm, mode: 'insensitive' } },
            { lastname: { contains: data.searchTerm, mode: 'insensitive' } },
            { phoneNumber: { contains: data.searchTerm, mode: 'insensitive' } },
            { address: { contains: data.searchTerm, mode: 'insensitive' } },
            { user: { account: { email: { contains: data.searchTerm, mode: 'insensitive' } } } }
          ]
        },
        skip,
        take
      })
      const total = await prisma.patient.count({
        where: {
          OR: [
            { firstname: { contains: data.searchTerm, mode: 'insensitive' } },
            { lastname: { contains: data.searchTerm, mode: 'insensitive' } },
            { phoneNumber: { contains: data.searchTerm, mode: 'insensitive' } },
            { address: { contains: data.searchTerm, mode: 'insensitive' } },
            { user: { account: { email: { contains: data.searchTerm, mode: 'insensitive' } } } }
          ]
        }
      })

      return this.formatPaginationResult(patients, total, data.page, data.limit)
    } catch (error) {
      this.handleError(error, 'searchPatients')
    }
  }

  async getPatientAppointmentHistory(data: GetPatientAppointmentHistoryDto) {
    try {
      const { skip, take } = this.calculatePagination(data.page, data.limit)

      const appointments = await prisma.appointment.findMany({
        where: { patientId: data.patientId },
        skip,
        take,
        include: {
          medicalRoom: {
            include: {
              service: true,
              department: true
            }
          }
        }
      })
      const total = await prisma.appointment.count({ where: { patientId: data.patientId } })

      return this.formatPaginationResult(appointments, total, data.page, data.limit)
    } catch (error) {
      this.handleError(error, 'getPatientAppointmentHistory')
    }
  }

  async getPatientStatistics(patientId: string) {
    try {
      return await prisma.patient.findUnique({
        where: { id: patientId },
        select: {
          _count: {
            select: {
              Appointment: true,
              BookingTime: true
            }
          }
        }
      })
    } catch (error) {
      this.handleError(error, 'getPatientStatistics')
    }
  }

  async getPatientMedicalHistory(patientId: string) {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId }
      })
      if (!patient) {
        throw new Error('Patient not found')
      }

      // Get all appointments with diagnosis suggestions
      const appointments = await prisma.appointment.findMany({
        where: { patientId },
        include: {
          suggestions: true,
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
        },
        orderBy: {
          bookingTime: {
            medicalRoomTime: {
              fromTime: 'desc'
            }
          }
        }
      })

      const commonConditions = this.extractCommonConditions(appointments)

      return {
        patient,
        totalAppointments: appointments.length,
        appointments,
        commonConditions,
        lastVisit: appointments[0]?.bookingTime?.medicalRoomTime?.fromTime || null
      }
    } catch (error) {
      this.handleError(error, 'getPatientMedicalHistory')
    }
  }

  private extractCommonConditions(appointments: any[]): string[] {
    const conditions: { [key: string]: number } = {}

    appointments.forEach((appointment) => {
      appointment.suggestions?.forEach((suggestion: any) => {
        if (suggestion.disease) {
          conditions[suggestion.disease] = (conditions[suggestion.disease] || 0) + 1
        }
      })
    })

    return Object.entries(conditions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([condition]) => condition)
  }

  async deletePatient(id: string): Promise<void> {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          Appointment: true
        }
      })
      if (!patient) {
        throw new Error('Patient not found')
      }

      // Check for active appointments
      const activeAppointments = await prisma.appointment.count({
        where: {
          patientId: id,
          status: { in: ['BOOKED', 'PAID'] },
          bookingTime: {
            medicalRoomTime: {
              fromTime: { gte: new Date() }
            }
          }
        }
      })

      if (activeAppointments > 0) {
        throw new Error('Cannot delete patient with active appointments. Cancel appointments first.')
      }

      // Delete related appointments first
      await prisma.appointment.deleteMany({
        where: { patientId: id }
      })

      await prisma.patient.delete({
        where: { id }
      })
    } catch (error) {
      this.handleError(error, 'deletePatient')
    }
  }
}
