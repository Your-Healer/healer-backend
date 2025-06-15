export interface CreateMedicalRoomDto {
  departmentId: string
  serviceId: string
  floor: number
  name: string
}

export interface UpdateMedicalRoomDto {
  departmentId?: string
  serviceId?: string
  floor?: number
  name?: string
}

export interface CreateTimeSlotDto {
  roomId: string
  fromTime: Date
  toTime: Date
}

export interface UpdateTimeSlotDto {
  roomId?: string
  fromTime?: Date
  toTime?: Date
}

export interface GetMedicalRoomsDto {
  filter: MedicalRoomFilter
  page: number
  limit: number
}

export interface CreateBulkTimeSlotsDto {
  roomId: string
  dates: Date[]
  timeSlots: Array<{ startHour: number; endHour: number; slotDuration: number }>
}

export interface GetTimeSlotsDto {
  filter: TimeSlotFilter
  page: number
  limit: number
}

export interface GetAvailableTimeSlotsDto {
  roomId?: string
  departmentId?: string
  serviceId?: string
  date?: Date
}

export interface CreateServiceDto {
  name: string
  description?: string
}

export interface UpdateServiceDto {
  id: string
  name?: string
  description?: string
}

export interface GetServicesDto {
  page: number
  limit: number
}

export interface GetMedicalStatisticsDto {
  departmentId?: string
}

export interface GetRoomUtilizationDto {
  roomId: string
  fromDate?: Date
  toDate?: Date
}

export interface GetServicePopularityDto {
  fromDate?: Date
  toDate?: Date
}

export interface MedicalRoomFilter {
  departmentId?: string
  serviceId?: string
  floor?: number
  available?: boolean
  searchTerm?: string
}

export interface TimeSlotFilter {
  id?: string
  roomId?: string
  departmentId?: string
  date?: Date
  fromTime?: Date
  toTime?: Date
  available?: boolean
}
