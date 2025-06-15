import { GetRoleDto } from '~/dtos/role.dto'
import BaseService from './base.service'
import prisma from '~/libs/prisma/init'

export default class RoleService extends BaseService {
  private static instance: RoleService
  private constructor() {
    super()
  }
  public static getInstance(): RoleService {
    if (!RoleService.instance) {
      RoleService.instance = new RoleService()
    }
    return RoleService.instance
  }

  async getRoles(data: GetRoleDto) {
    try {
      const { skip, take } = this.calculatePagination(data.page, data.limit)

      const where: any = {}

      if (data.roleId) {
        where.id = data.roleId
      }

      if (data.roleName) {
        where.name = {
          contains: data.roleName,
          mode: 'insensitive'
        }
      }

      const [roles, total] = await Promise.all([
        prisma.role.findMany({
          where,
          skip,
          take,
          include: {
            accounts: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    firstname: true,
                    lastname: true
                  }
                },
                staff: {
                  select: {
                    id: true,
                    firstname: true,
                    lastname: true
                  }
                }
              }
            }
          }
        }),
        prisma.role.count({ where })
      ])

      return this.formatPaginationResult(roles, total, data.page, data.limit)
    } catch (error) {
      this.handleError(error, 'getRoles')
    }
  }
}
