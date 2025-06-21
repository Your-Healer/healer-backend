import { APPOINTMENTSTATUS } from '@prisma/client'

export interface Pagination {
  page: number
  limit: number
}

export interface GetPatientAppointmentHistoryDto extends Pagination {
  patientId: string
  status?: APPOINTMENTSTATUS
}

export interface OrderBy {
  field: string
  direction: 'asc' | 'desc'
}

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
