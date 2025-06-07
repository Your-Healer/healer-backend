import { Service, Prisma } from '@prisma/client'
import BaseService from './base.service'
import prisma from '~/libs/prisma/init'
import { CreateServiceDto, GetServicesDto, UpdateServiceDto } from '~/dtos/service.dto'

export default class ServiceService extends BaseService {
  private static instance: ServiceService
  private constructor() {
    super()
  }

  static getInstance(): ServiceService {
    if (!ServiceService.instance) {
      ServiceService.instance = new ServiceService()
    }
    return ServiceService.instance
  }

  async createService(data: CreateServiceDto): Promise<Service> {
    try {
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

  async updateService(id: string, data: UpdateServiceDto): Promise<Service> {
    try {
      const existing = await prisma.service.findUnique({
        where: { id }
      })
      if (!existing) {
        throw new Error('Service not found')
      }

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

  async getServices(data: GetServicesDto) {
    try {
      const { skip, take } = this.calculatePagination(data.page, data.limit)

      const where: any = {}

      if (data.filter.searchTerm) {
        where.OR = [
          { name: { contains: data.filter.searchTerm, mode: 'insensitive' } },
          { description: { contains: data.filter.searchTerm, mode: 'insensitive' } }
        ]
      }

      if (data.filter.minPrice !== undefined) {
        where.price = { ...where.price, gte: data.filter.minPrice }
      }

      if (data.filter.maxPrice !== undefined) {
        where.price = { ...where.price, lte: data.filter.maxPrice }
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

      return this.formatPaginationResult(services, total, data.page, data.limit)
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
