export interface CreateShiftDto {
  staffId: string
  roomId: string
  fromTime: Date
  toTime: Date
}

export interface UpdateShiftDto {
  id: string
  staffId?: string
  roomId?: string
  fromTime?: Date
  toTime?: Date
}

export interface ShiftFilter {
  staffId?: string
  roomId?: string
  departmentId?: string
  date?: Date
  fromDate?: Date
  toDate?: Date
}

export interface BulkShiftDto {
  staffId: string
  roomId: string
  dates: Date[]
  morningShift?: { startHour: number; endHour: number }
  afternoonShift?: { startHour: number; endHour: number }
}

export interface RecurringShiftDto {
  staffId: string
  roomId: string
  startDate: Date
  endDate: Date
  daysOfWeek: number[] // 0 = Sunday, 1 = Monday, etc.
  timeSlots: Array<{
    startHour: number
    endHour: number
  }>
}

export interface GetShiftsDto {
  filter: ShiftFilter
  page: number
  limit: number
}

export interface GetShiftsByStaffDto {
  staffId: string
  fromDate?: Date
  toDate?: Date
  page: number
  limit: number
}

export interface GetShiftsByRoomDto {
  roomId: string
  fromDate?: Date
  toDate?: Date
  page: number
  limit: number
}

export interface GetShiftsByDepartmentDto {
  departmentId: string
  fromDate?: Date
  toDate?: Date
  page: number
  limit: number
}

export interface GetShiftsByDateRangeDto {
  fromDate: Date
  toDate: Date
  page: number
  limit: number
}
export interface GetShiftStatisticsDto {
  filter: ShiftFilter
}

export interface CheckShiftConflictsDto {
  staffId: string
  fromTime: Date
  toTime: Date
  excludeShiftId?: string
}

export interface AssignShiftDto {
  staffId: string
  roomId: string
  fromTime: Date
  toTime: Date
}

export interface CreateShiftWorkingDto {
  staffId: string
  roomId: string
  fromTime: Date
  toTime: Date
}

export interface UpdateShiftWorkingDto {
  staffId?: string
  roomId?: string
  fromTime?: Date
  toTime?: Date
}

export interface GetShiftWorkingDto {
  page: number
  limit: number
  staffId?: string
  roomId?: string
  departmentId?: string
  date?: Date
  fromDate?: Date
  toDate?: Date
  status?: 'upcoming' | 'active' | 'completed'
}

export interface BulkShiftWorkingDto {
  staffId: string
  roomId: string
  dates: Date[]
  morningShift?: {
    startHour: number
    endHour: number
  }
  afternoonShift?: {
    startHour: number
    endHour: number
  }
}

export interface RecurringShiftWorkingDto {
  staffId: string
  roomId: string
  startDate: Date
  endDate: Date
  daysOfWeek: number[] // 0 = Sunday, 1 = Monday, etc.
  timeSlots: Array<{
    startHour: number
    endHour: number
  }>
}

export interface AssignShiftWorkingDto {
  staffId: string
  roomId: string
  fromTime: Date
  toTime: Date
}

export interface CheckShiftConflictsDto {
  staffId: string
  fromTime: Date
  toTime: Date
  excludeShiftId?: string
}

export interface ShiftWorkingStatisticsDto {
  fromDate?: Date
  toDate?: Date
  departmentId?: string
}
