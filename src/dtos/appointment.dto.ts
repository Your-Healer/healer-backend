import { APPOINTMENTSTATUS } from '@prisma/client'

export interface Pagination {
  page: number
  limit: number
}

export interface GetPatientAppointmentHistoryDto extends Pagination {
  patientId: string
  status?: APPOINTMENTSTATUS
}
