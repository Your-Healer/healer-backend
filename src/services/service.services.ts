import { Service, Prisma } from '@prisma/client'
import { BaseService } from './base.service'
import prisma from '~/libs/prisma/init'

export interface CreateServiceData {
  name: string
  description?: string
  durationTime?: number
  price?: number
}

export interface UpdateServiceData {
  name?: string
  description?: string
  durationTime?: number
  price?: number
}

export interface ServiceFilter {
  searchTerm?: string
  minPrice?: number
  maxPrice?: number
}

export default class ServiceService extends BaseService {
  async createService(data: CreateServiceData): Promise<Service> {
    try {
      // Check if service name is unique
      const existing = await prisma.service.findFirst({
        where: { name: data.name }
      })
      if (existing) {
        throw new Error('Service name already exists')
      }

      const serviceData: Prisma.ServiceCreateInput = {
        name: data.name,
        description: data.description,
        durationTime: data.durationTime || 0,
        price: data.price || 0
      }

      return await prisma.service.create({
        data: serviceData
      })
    } catch (error) {
      this.handleError(error, 'createService')
    }
  }

  async updateService(id: string, data: UpdateServiceData): Promise<Service> {
    try {
      const existing = await prisma.service.findUnique({
        where: { id }
      })
      if (!existing) {
        throw new Error('Service not found')
      }

      // Check name uniqueness if changing
      if (data.name && data.name !== existing.name) {
        const nameExists = await prisma.service.findFirst({
          where: { name: data.name }
        })
        if (nameExists) {
          throw new Error('Service name already exists')
        }
      }

      return await prisma.service.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          durationTime: data.durationTime,
          price: data.price
        }
      })
    } catch (error) {
      this.handleError(error, 'updateService')
    }
  }

  async getServices(filter: ServiceFilter = {}, page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      const where: any = {}

      if (filter.searchTerm) {
        where.OR = [
          { name: { contains: filter.searchTerm, mode: 'insensitive' } },
          { description: { contains: filter.searchTerm, mode: 'insensitive' } }
        ]
      }

      if (filter.minPrice !== undefined) {
        where.price = { ...where.price, gte: filter.minPrice }
      }

      if (filter.maxPrice !== undefined) {
        where.price = { ...where.price, lte: filter.maxPrice }
      }

      const [services, total] = await Promise.all([
        prisma.service.findMany({
          skip,
          take,
          where,
          include: {
            _count: {
              select: {
                medicalRooms: true
              }
            }
          }
        }),
        prisma.service.count({ where })
      ])

      return this.formatPaginationResult(services, total, page, limit)
    } catch (error) {
      this.handleError(error, 'getServices')
    }
  }

  async getServiceById(id: string) {
    try {
      return await prisma.service.findUnique({
        where: { id },
        include: {
          medicalRooms: {
            include: {
              department: true
            }
          }
        }
      })
    } catch (error) {
      this.handleError(error, 'getServiceById')
    }
  }

  async deleteService(id: string): Promise<void> {
    try {
      const service = await prisma.service.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              medicalRooms: true
            }
          }
        }
      })

      if (!service) {
        throw new Error('Service not found')
      }

      if (service._count.medicalRooms > 0) {
        throw new Error('Cannot delete service with medical rooms. Remove rooms first.')
      }

      await prisma.service.delete({
        where: { id }
      })
    } catch (error) {
      this.handleError(error, 'deleteService')
    }
  }

  async getAllServices() {
    try {
      return await prisma.service.findMany()
    } catch (error) {
      this.handleError(error, 'getAllServices')
    }
  }
}
