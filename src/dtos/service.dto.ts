export interface CreateServiceDto {
  name: string
  description?: string
  durationTime?: number
  price?: number
}

export interface UpdateServiceDto {
  name?: string
  description?: string
  durationTime?: number
  price?: number
}

export interface GetServicesDto {
  filter: ServiceFilter
  page: number
  limit: number
}

export interface ServiceFilter {
  searchTerm?: string
  minPrice?: number
  maxPrice?: number
}

export interface ServiceResponse {
  id: string
  name: string
  description?: string
  durationTime: number
  price: number
  createdAt: Date
  updatedAt: Date
}

export interface ServiceWithStats extends ServiceResponse {
  _count: {
    medicalRooms: number
  }
}
