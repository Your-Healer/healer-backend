import { GetPositionDto } from '~/dtos/position.dto'
import BaseService from './base.service'
import prisma from '~/libs/prisma/init'

export default class PositionService extends BaseService {
  private static instance: PositionService
  private constructor() {
    super()
  }

  public static getInstance(): PositionService {
    if (!PositionService.instance) {
      PositionService.instance = new PositionService()
    }
    return PositionService.instance
  }

  async getPositions(data: GetPositionDto) {
    try {
      const { skip, take } = this.calculatePagination(data.page, data.limit)

      const where: any = {}

      if (data.positionId) {
        where.id = data.positionId
      }

      const [positions, total] = await Promise.all([
        prisma.position.findMany({
          where,
          skip,
          take,
          include: {
            staffAssignments: {
              include: {
                staff: {
                  select: {
                    id: true,
                    firstname: true,
                    lastname: true
                  }
                },
                position: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }),
        prisma.position.count({ where })
      ])

      return this.formatPaginationResult(positions, total, data.page, data.limit)
    } catch (error) {
      this.handleError(error, 'getPositions')
    }
  }
}
