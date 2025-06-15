import { GetLocationRequest } from '~/dtos/location.dto'
import BaseService from './base.service'
import prisma from '~/libs/prisma/init'

export default class LocationService extends BaseService {
  private static instance: LocationService

  private constructor() {
    super()
  }

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService()
    }
    return LocationService.instance
  }

  async getLocations(data: GetLocationRequest) {
    try {
      const { page = 1, limit = 10, name, location } = data
      const skip = (page - 1) * limit

      const where: any = {}
      if (name) {
        where.name = {
          contains: name,
          mode: 'insensitive'
        }
      }
      if (location) {
        where.OR = [
          { street: { contains: location, mode: 'insensitive' } },
          { city: { contains: location, mode: 'insensitive' } },
          { country: { contains: location, mode: 'insensitive' } },
          { detail: { contains: location, mode: 'insensitive' } }
        ]
      }

      const [locations, total] = await Promise.all([
        prisma.location.findMany({
          where,
          skip,
          take: limit
        }),
        prisma.location.count({ where })
      ])

      return {
        locations,
        total,
        page,
        limit
      }
    } catch (error) {
      this.handleError(error, 'getLocations')
    }
  }
}
