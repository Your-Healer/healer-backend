import { Request, Response, NextFunction } from 'express'
import DepartmentService from '~/services/department.service'

const departmentService = DepartmentService.getInstance()

export async function createDepartmentController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { locationId, name, symbol, floor } = req.body

    if (!locationId || !name || !symbol || floor === undefined) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const department = await departmentService.createDepartment({
      locationId,
      name,
      symbol,
      floor
    })

    return res.status(201).json({
      message: 'Department created successfully',
      department
    })
  } catch (error: any) {
    console.error('Error creating department:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function updateDepartmentController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const { locationId, name, symbol, floor } = req.body

    const department = await departmentService.updateDepartment(id, {
      locationId,
      name,
      symbol,
      floor
    })

    return res.status(200).json({
      message: 'Department updated successfully',
      department
    })
  } catch (error: any) {
    console.error('Error updating department:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getDepartmentByIdController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const department = await departmentService.getDepartmentById(id)

    if (!department) {
      return res.status(404).json({ error: 'Department not found' })
    }

    return res.status(200).json(department)
  } catch (error: any) {
    console.error('Error fetching department:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getDepartmentsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { locationId, floor, searchTerm, page = 1, limit = 10 } = req.query

    const filter = {
      locationId: locationId as string,
      floor: floor ? parseInt(floor as string) : undefined,
      searchTerm: searchTerm as string
    }

    const result = await departmentService.getDepartments({
      filter,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    })

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching departments:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getDepartmentMedicalRoomsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const { id } = req.params
    const { page = 1, limit = 10 } = req.query

    const result = await departmentService.getDepartmentMedicalRooms({
      departmentId: id,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    })

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching department medical rooms:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getDepartmentStaffController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const { page = 1, limit = 10 } = req.query

    const result = await departmentService.getDepartmentStaff(id, {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    })

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching department staff:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function assignStaffToDepartmentController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const { staffId } = req.body

    if (!staffId) {
      return res.status(400).json({ error: 'Staff ID is required' })
    }

    await departmentService.assignStaffToDepartment({
      departmentId: id,
      staffId
    })

    return res.status(200).json({
      message: 'Staff assigned to department successfully'
    })
  } catch (error: any) {
    console.error('Error assigning staff to department:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function removeStaffFromDepartmentController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const { id, staffId } = req.params

    await departmentService.removeStaffFromDepartment({
      departmentId: id,
      staffId
    })

    return res.status(200).json({
      message: 'Staff removed from department successfully'
    })
  } catch (error: any) {
    console.error('Error removing staff from department:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function deleteDepartmentController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params

    await departmentService.deleteDepartment(id)

    return res.status(200).json({
      message: 'Department deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting department:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function getDepartmentStatisticsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const stats = await departmentService.getDepartmentStatistics({
      departmentId: id,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10
    })

    return res.status(200).json(stats)
  } catch (error: any) {
    console.error('Error fetching department statistics:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}

export async function bulkAssignStaffController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const { staffIds } = req.body

    if (!Array.isArray(staffIds) || staffIds.length === 0) {
      return res.status(400).json({ error: 'Staff IDs array is required' })
    }

    await departmentService.bulkAssignStaff({
      departmentId: id,
      staffIds
    })

    return res.status(200).json({
      message: 'Staff bulk assigned successfully'
    })
  } catch (error: any) {
    console.error('Error bulk assigning staff:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
