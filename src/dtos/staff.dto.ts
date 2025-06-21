import { APPOINTMENTSTATUS, EDUCATIONLEVEL, GENDER } from '~/utils/enum'

export interface CreateStaffDto {
  username: string
  password: string
  email: string
  phoneNumber?: string
  firstname: string
  lastname: string
  walletAddress: string
  walletMnemonic: string
  introduction?: string
  educationLevel: EDUCATIONLEVEL
  gender: GENDER
  positionIds?: string[]
  departmentIds?: string[]
}

export interface UpdateStaffDto {
  firstname?: string
  lastname?: string
  introduction?: string
  educationLevel?: EDUCATIONLEVEL
  gender?: GENDER
  positionIds?: string[]
  departmentIds?: string[]
}

export interface GetStaffDto {
  page: number
  limit: number
  query: string
  departmentId?: string
  positionId?: string
  educationLevel?: EDUCATIONLEVEL
  gender?: GENDER
}

export interface StaffSearchDto {
  query: string
  departmentId?: string
  positionId?: string
  educationLevel?: EDUCATIONLEVEL
  page: number
  limit: number
}

export interface BulkStaffOperationDto {
  staffIds: string[]
  departmentId?: string
  positionIds?: string[]
}

export interface BulkUpdateStaffDto {
  staffIds: string[]
  updateData: UpdateStaffDto
}

export interface StaffStatisticsDto {
  departmentId?: string
  fromDate?: Date
  toDate?: Date
}

export interface StaffWorkloadDto {
  departmentId?: string
  fromDate?: Date
  toDate?: Date
  sortBy?: 'totalHours' | 'totalShifts' | 'averageDuration'
}

export interface StaffScheduleDto {
  fromDate?: Date
  toDate?: Date
  view?: 'day' | 'week' | 'month'
}

export interface GetStaffAppointmentsDto {
  page: number
  limit: number
  date?: Date
  status?: APPOINTMENTSTATUS
}

export interface GetStaffPatientsDto {
  date?: Date
}

export interface GetStaffShiftsDto {
  fromDate?: Date
  toDate?: Date
}
