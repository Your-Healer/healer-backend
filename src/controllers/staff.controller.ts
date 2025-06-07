import { Request, Response, NextFunction } from 'express'
import cryptoJs from 'crypto-js'

import prisma from '~/libs/prisma/init'
import StaffService from '~/services/staff.service'
import BlockchainService from '~/services/blockchain.service'
import config from '~/configs/env'

const staffService = StaffService.getInstance()
const blockchainService = BlockchainService.getInstance()

export async function createStaffController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const {
      username,
      password,
      email,
      phoneNumber,
      firstname,
      lastname,
      positionIds,
      departmentIds,
      introduction,
      educationLevel
    } = req.body

    const staffRole = await prisma.role.findFirst({
      where: {
        name: 'Staff'
      }
    })

    if (!staffRole) {
      return res.status(400).json({ message: 'Staff role not found' })
    }

    // Create wallet if needed
    let walletAddress = null
    let encryptedMnemonic = null

    const { mnemonic, isValidMnemonic, pair } = await blockchainService.createNewWallet()

    if (!mnemonic || !isValidMnemonic) {
      return res.status(400).json({ error: 'Failed to create wallet' })
    }

    walletAddress = pair.address
    encryptedMnemonic = cryptoJs.AES.encrypt(mnemonic, config.secrets.secretKey).toString()

    const { account, staff } = await staffService.createStaff({
      username,
      password,
      email,
      firstname,
      lastname,
      walletAddress,
      walletMnemonic: encryptedMnemonic,
      phoneNumber,
      introduction,
      educationLevel,
      positionIds,
      departmentIds
    })

    return res.status(201).json({
      message: 'Staff created successfully',
      staff: {
        id: staff.id,
        firstname: staff.firstname,
        lastname: staff.lastname,
        email: account.email
      }
    })
  } catch (error) {
    console.error('Error creating staff:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getAllStaffController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const departmentId = req.query.departmentId as string
    const positionId = req.query.positionId as string
    const educationLevel = req.query.educationLevel as any

    const result = await staffService.getAllStaff({
      page,
      limit,
      departmentId,
      positionId,
      educationLevel
    })

    return res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function getStaffByIdController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const staff = await staffService.getStaffById(id)

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' })
    }

    return res.status(200).json(staff)
  } catch (error) {
    next(error)
  }
}

export async function updateStaffController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const staff = await staffService.updateStaff(id, req.body)

    return res.status(200).json({
      message: 'Staff updated successfully',
      staff
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteStaffController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    await staffService.deleteStaff(id)

    return res.status(200).json({
      message: 'Staff deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}

export async function searchStaffController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const query = req.query.query as string
    if (!query) {
      return res.status(400).json({ message: 'Query parameter is required' })
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const departmentId = req.query.departmentId as string
    const positionId = req.query.positionId as string
    const educationLevel = req.query.educationLevel as any

    const result = await staffService.searchStaff({
      query,
      page,
      limit,
      departmentId,
      positionId,
      educationLevel
    })

    return res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function getStaffProfileController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountId } = (req as any).user
    if (!accountId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const staff = await staffService.getStaffProfile(accountId)
    if (!staff) {
      return res.status(404).json({ message: 'Staff profile not found' })
    }

    return res.status(200).json(staff)
  } catch (error) {
    next(error)
  }
}

export async function updateStaffProfileController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountId } = (req as any).user
    if (!accountId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const staff = await staffService.updateStaffProfile(accountId, req.body)

    return res.status(200).json({
      message: 'Profile updated successfully',
      staff
    })
  } catch (error) {
    next(error)
  }
}

export async function getStaffShiftsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountId } = (req as any).user
    if (!accountId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const fromDate = req.query.from ? new Date(req.query.from as string) : undefined
    const toDate = req.query.to ? new Date(req.query.to as string) : undefined

    const shifts = await staffService.getStaffShifts(accountId, {
      fromDate,
      toDate
    })

    return res.status(200).json(shifts)
  } catch (error) {
    next(error)
  }
}

export async function getStaffAppointmentsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountId } = (req as any).user
    if (!accountId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const date = req.query.date ? new Date(req.query.date as string) : undefined
    const status = req.query.status as any

    const result = await staffService.getStaffAppointments(accountId, {
      page,
      limit,
      date,
      status
    })

    return res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function getStaffStatisticsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const departmentId = req.query.departmentId as string
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined

    const statistics = await staffService.getStaffStatistics({
      departmentId,
      fromDate,
      toDate
    })

    return res.status(200).json({ statistics })
  } catch (error) {
    next(error)
  }
}

export async function getStaffWorkloadController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const departmentId = req.query.departmentId as string
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined
    const sortBy = req.query.sortBy as any

    const workload = await staffService.getStaffWorkload({
      departmentId,
      fromDate,
      toDate,
      sortBy
    })

    // Calculate summary
    const totalStaff = workload.length
    const averageHoursPerStaff = totalStaff > 0 ? workload.reduce((acc, w) => acc + w.totalHours, 0) / totalStaff : 0
    const mostOverworkedStaff = workload.length > 0 ? workload[0] : null

    return res.status(200).json({
      workload,
      summary: {
        totalStaff,
        averageHoursPerStaff: Math.round(averageHoursPerStaff * 100) / 100,
        mostOverworkedStaff: mostOverworkedStaff
          ? {
              staffId: mostOverworkedStaff.staffId,
              name: mostOverworkedStaff.staffName,
              totalHours: mostOverworkedStaff.totalHours
            }
          : null
      }
    })
  } catch (error) {
    next(error)
  }
}

export async function bulkAssignStaffController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const result = await staffService.bulkAssignStaff(req.body)
    return res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function bulkUpdateStaffController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const result = await staffService.bulkUpdateStaff(req.body)
    return res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function getStaffByDepartmentController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { departmentId } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const positionId = req.query.positionId as string

    const result = await staffService.getStaffByDepartment(departmentId, page, limit, positionId)
    return res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function getStaffByPositionController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { positionId } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const departmentId = req.query.departmentId as string

    const result = await staffService.getStaffByPosition(positionId, page, limit, departmentId)
    return res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function getStaffPatientsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const date = req.query.date ? new Date(req.query.date as string) : new Date()

    // This would need to be implemented based on your appointment/patient relationship logic
    // For now, returning a placeholder response
    return res.status(200).json([])
  } catch (error) {
    next(error)
  }
}

export async function getStaffScheduleController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined
    const view = (req.query.view as any) || 'week'

    // This would implement schedule logic - placeholder for now
    return res.status(200).json({
      schedule: {},
      staff: null,
      totalHours: 0
    })
  } catch (error) {
    next(error)
  }
}

export async function getIndividualStaffWorkloadController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const { id } = req.params
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined

    // Implementation would go here - placeholder for now
    return res.status(200).json({
      workload: null,
      comparison: {
        departmentAverage: 0,
        hospitalAverage: 0,
        percentileRank: 0
      }
    })
  } catch (error) {
    next(error)
  }
}
