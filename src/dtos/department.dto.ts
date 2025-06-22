export interface CreateAttachmentDto {
  fileName: string
  directory: string
  medicalType: string
}

export interface CreateDepartmentDto {
  locationId: string
  name: string
  symbol: string
  floor: number
  icon?: Express.Multer.File
  backgroundColor?: string
  description?: string
}

export interface UpdateDepartmentDto {
  locationId?: string
  name?: string
  symbol?: string
  floor?: number
  description?: string
}

export interface GetDepartmentsDto {
  filter: DepartmentFilter
  page: number
  limit: number
}

export interface GetDepartmentMedicalRoomsDto {
  departmentId: string
  page: number
  limit: number
}

export interface GetDepartmentStaffDto {
  page: number
  limit: number
}

export interface AssignStaffToDepartmentDto {
  departmentId: string
  staffId: string
}

export interface RemoveStaffFromDepartmentDto {
  departmentId: string
  staffId: string
}

export interface SearchDepartmentsDto {
  searchTerm: string
  page: number
  limit: number
}

export interface GetDepartmentStatisticsDto {
  departmentId?: string
}

export interface GetDepartmentsByFloorDto {
  locationId: string
  floor: number
}

export interface GetAvailableFloorsInLocationDto {
  locationId: string
}

export interface BulkAssignStaffDto {
  departmentId: string
  staffIds: string[]
}

export interface DepartmentFilter {
  locationId?: string
  floor?: number
  searchTerm?: string
}
