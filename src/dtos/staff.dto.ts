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
  educationLevel: 'HIGHSCHOOL' | 'BACHELOR' | 'MASTER' | 'DOCTORATE'
  positionIds?: string[]
  departmentIds?: string[]
}

export interface UpdateStaffDto {
  firstname?: string
  lastname?: string
  introduction?: string
  educationLevel?: 'HIGHSCHOOL' | 'BACHELOR' | 'MASTER' | 'DOCTORATE'
  positionIds?: string[]
  departmentIds?: string[]
}

export interface GetStaffDto {
  page: number
  limit: number
  query: string
  departmentId?: string
  positionId?: string
  educationLevel?: 'HIGHSCHOOL' | 'BACHELOR' | 'MASTER' | 'DOCTORATE'
}

export interface StaffSearchDto {
  query: string
  departmentId?: string
  positionId?: string
  educationLevel?: 'HIGHSCHOOL' | 'BACHELOR' | 'MASTER' | 'DOCTORATE'
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
  status?: 'BOOKED' | 'PAID' | 'CANCEL'
}

export interface GetStaffPatientsDto {
  date?: Date
}

export interface GetStaffShiftsDto {
  fromDate?: Date
  toDate?: Date
}
