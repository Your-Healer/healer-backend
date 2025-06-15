import { NextFunction, Request, Response } from 'express'
import RoleService from '~/services/roles.service'

const roleService = RoleService.getInstance()

export async function getRolesController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { roleId, roleName, page = 1, limit = 10 } = req.query

    const data = {
      roleId: typeof roleId === 'string' ? roleId : undefined,
      roleName: typeof roleName === 'string' ? roleName : undefined,
      page: Number(page),
      limit: Number(limit)
    }

    const result = await roleService.getRoles(data)

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching roles:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
