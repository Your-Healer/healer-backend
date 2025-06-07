import { SubmittableExtrinsicFunction } from '@polkadot/api/types'
import { APPOINTMENTSTATUS, EDUCATIONLEVEL } from '@prisma/client'

// Common interfaces
export interface PaginationOptions {
  page?: number
  limit?: number
}

export interface PaginationResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
  pagination?: Omit<PaginationResult<any>, 'data'>
}

// Authentication and authorization
export interface JWTPayload {
  userName: string
  accountId: string
  id: string
  verified: boolean
  isStaff: boolean
  iat?: number
  exp?: number
}

export interface LoginRequest {
  username: string
  password: string
}

// User and Staff types
export interface CreateUserRequest {
  roleId: string
  username: string
  password: string
  email: string
  firstname: string
  lastname: string
  walletAddress: string
  walletMnemonic: string
  phoneNumber?: string
  address?: string
}

export interface CreateStaffRequest extends CreateUserRequest {
  introduction?: string
  educationLevel?: EDUCATIONLEVEL
  positionIds?: string[]
  departmentIds?: string[]
}

export interface UpdateUserRequest {
  firstname?: string
  lastname?: string
  phoneNumber?: string
  address?: string
}

export interface UpdateStaffRequest extends UpdateUserRequest {
  introduction?: string
  educationLevel?: EDUCATIONLEVEL
}

// Medical entities
export interface CreateMedicalRoomRequest {
  departmentId: string
  serviceId: string
  floor: number
  name: string
}

export interface UpdateMedicalRoomRequest {
  departmentId?: string
  serviceId?: string
  floor?: number
  name?: string
}

export interface CreateDepartmentRequest {
  locationId: string
  name: string
  symbol: string
  floor: number
}

export interface UpdateDepartmentRequest {
  locationId?: string
  name?: string
  symbol?: string
  floor?: number
}

export interface CreateServiceRequest {
  name: string
  description?: string
  durationTime: number
}

export interface UpdateServiceRequest {
  name?: string
  description?: string
  durationTime?: number
}

// Appointment types
export interface CreateAppointmentRequest {
  userId: string
  patientId: string
  medicalRoomTimeId: string
  notes?: string
}

export interface UpdateAppointmentStatusRequest {
  status: APPOINTMENTSTATUS
  reason?: string
}

export interface CreateDiagnosisSuggestionRequest {
  appointmentId: string
  suggestedByAI: boolean
  disease: string
  confidence: number
  description?: string
}

// Shift working types
export interface CreateShiftRequest {
  doctorId: string
  roomId: string
  fromTime: Date
  toTime: Date
}

export interface UpdateShiftRequest {
  doctorId?: string
  roomId?: string
  fromTime?: Date
  toTime?: Date
}

export interface BulkCreateShiftRequest {
  doctorId: string
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

// Filter types
export interface AppointmentFilter {
  userId?: string
  staffId?: string
  departmentId?: string
  status?: APPOINTMENTSTATUS
  date?: Date
  fromDate?: Date
  toDate?: Date
}

export interface ShiftFilter {
  doctorId?: string
  roomId?: string
  departmentId?: string
  date?: Date
  fromDate?: Date
  toDate?: Date
}

export interface StaffFilter {
  departmentId?: string
  positionId?: string
  educationLevel?: EDUCATIONLEVEL
  searchTerm?: string
}

export interface TimeSlotFilter {
  departmentId?: string
  serviceId?: string
  date?: Date
  availableOnly?: boolean
}

export interface MedicalRoomFilter {
  departmentId?: string
  serviceId?: string
  floor?: number
  availableOnly?: boolean
}

// Statistics types
export interface AppointmentStatistics {
  total: number
  booked: number
  paid: number
  cancelled: number
  completionRate: number
  cancellationRate: number
}

export interface MedicalStatistics {
  totalRooms: number
  totalSlots: number
  bookedSlots: number
  availableSlots: number
  occupancyRate: number
  totalAppointments: number
}

export interface ShiftStatistics {
  totalShifts: number
  uniqueDoctors: number
  uniqueRooms: number
  averageShiftsPerDoctor: number
}

export interface PatientStatistics {
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  upcomingAppointments: number
  attendanceRate: number
}

// Error types
export interface ValidationError {
  field: string
  message: string
  value?: any
}

export interface ApiError {
  message: string
  statusCode: number
  details?: ValidationError[]
}

// Common utility types
export type SortOrder = 'asc' | 'desc'

export interface SortOptions {
  field: string
  order: SortOrder
}

export interface DateRange {
  fromDate: Date
  toDate: Date
}

export interface TimeRange {
  fromTime: Date
  toTime: Date
}

// Export all Prisma enums for convenience
export { APPOINTMENTSTATUS, EDUCATIONLEVEL }

export type AllExtrinsics = {
  [palletName: string]: {
    [methodName: string]: SubmittableExtrinsicFunction<'promise'>
  }
}
