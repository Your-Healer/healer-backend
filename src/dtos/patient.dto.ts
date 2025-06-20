import { GENDER } from '~/utils/enum'

export interface CreatePatientDto {
  userId: string
  firstname: string
  lastname: string
  phoneNumber?: string
  address?: string
  gender: GENDER
  emergencyContact?: string
  medicalHistory?: string
  dateOfBirth?: Date
  bloodType?: string
  allergies?: string
  insurance?: string
}

export interface UpdatePatientDto {
  firstname?: string
  lastname?: string
  phoneNumber?: string
  address?: string
  emergencyContact?: string
  medicalHistory?: string
  dateOfBirth?: Date
  gender?: GENDER
  bloodType?: string
  allergies?: string
  insurance?: string
}

export interface GetPatientsDto {
  filter: PatientFilter
  page: number
  limit: number
}

export interface GetPatientsByUserIdDto {
  userId: string
  page: number
  limit: number
}

export interface SearchPatientsDto {
  searchTerm: string
  page: number
  limit: number
}

export interface GetPatientAppointmentHistoryDto {
  patientId: string
  page: number
  limit: number
}

export interface PatientFilter {
  userId?: string
  searchTerm?: string
  hasAppointments?: boolean
  ageRange?: {
    min: number
    max: number
  }
  gender?: string
  bloodType?: string
}

export interface PatientStatistics {
  totalAppointments: number
  totalBookings: number
  upcomingAppointments?: number
  completedAppointments?: number
  cancelledAppointments?: number
}

export interface PatientMedicalHistory {
  patient: any
  totalAppointments: number
  appointments: any[]
  commonConditions: string[]
  lastVisit: Date | null
}
