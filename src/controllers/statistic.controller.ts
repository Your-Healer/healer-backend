import { Department, StaffOnDepartment } from '@prisma/client'
import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import StatisticService from '~/services/statistic.service'

const statisticService = StatisticService.getInstance()

export async function getAdminDashboardStatsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const stats = await statisticService.getAdminDashboardStats()

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Admin dashboard statistics retrieved successfully',
      data: stats
    })
  } catch (error) {
    console.error('Error getting admin dashboard stats:', error)
    next(error)
  }
}

export async function getDoctorDashboardStatsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { staffId } = req.params

    if (!staffId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Staff ID is required'
      })
    }

    const stats = await statisticService.getDoctorDashboardStats(staffId)

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Doctor dashboard statistics retrieved successfully',
      data: stats
    })
  } catch (error) {
    console.error('Error getting doctor dashboard stats:', error)
    next(error)
  }
}

export async function getMyDoctorStatsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { staffId } = (req as any).user

    if (!staffId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'User authentication required'
      })
    }

    const stats = await statisticService.getDoctorDashboardStats(staffId)

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Your dashboard statistics retrieved successfully',
      data: stats
    })
  } catch (error) {
    console.error('Error getting my doctor stats:', error)
    next(error)
  }
}

export async function getMonthlyStatsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { year } = req.query
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear()

    if (isNaN(targetYear) || targetYear < 2000 || targetYear > 2100) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid year parameter'
      })
    }

    const stats = await statisticService.getMonthlyStats(targetYear)

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Monthly statistics retrieved successfully',
      data: stats
    })
  } catch (error) {
    console.error('Error getting monthly stats:', error)
    next(error)
  }
}

export async function getDepartmentStatsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const stats = await statisticService.getDepartmentStats()

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Department statistics retrieved successfully',
      data: stats
    })
  } catch (error) {
    console.error('Error getting department stats:', error)
    next(error)
  }
}

export async function getStaffPerformanceStatsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  try {
    const { departmentId, fromDate, toDate, limit } = req.query

    const parsedFromDate = fromDate ? new Date(fromDate as string) : undefined
    const parsedToDate = toDate ? new Date(toDate as string) : undefined
    const parsedLimit = limit ? parseInt(limit as string) : undefined

    // Validate dates if provided
    if (parsedFromDate && isNaN(parsedFromDate.getTime())) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid fromDate parameter'
      })
    }

    if (parsedToDate && isNaN(parsedToDate.getTime())) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid toDate parameter'
      })
    }

    const stats = await statisticService.getStaffPerformanceStats()

    // Filter by department if provided
    let filteredStats = stats
    if (departmentId) {
      // This would need to be implemented in the service layer
      // For now, we'll return all stats
    }

    // Apply date filtering if needed
    // This would also need to be implemented in the service layer

    // Apply limit if provided
    if (parsedLimit && parsedLimit > 0) {
      filteredStats = filteredStats.slice(0, parsedLimit)
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Staff performance statistics retrieved successfully',
      data: filteredStats
    })
  } catch (error) {
    console.error('Error getting staff performance stats:', error)
    next(error)
  }
}

export async function getTimeSlotUtilizationController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { departmentId, fromDate, toDate } = req.query

    const parsedFromDate = fromDate ? new Date(fromDate as string) : undefined
    const parsedToDate = toDate ? new Date(toDate as string) : undefined

    // Validate dates if provided
    if (parsedFromDate && isNaN(parsedFromDate.getTime())) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid fromDate parameter'
      })
    }

    if (parsedToDate && isNaN(parsedToDate.getTime())) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid toDate parameter'
      })
    }

    const stats = await statisticService.getTimeSlotUtilization((departmentId as string) || undefined)

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Time slot utilization retrieved successfully',
      data: stats
    })
  } catch (error) {
    console.error('Error getting time slot utilization:', error)
    next(error)
  }
}

export async function getSystemStatisticsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { period = 'month', year } = req.query
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear()

    if (isNaN(targetYear) || targetYear < 2000 || targetYear > 2100) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid year parameter'
      })
    }

    const validPeriods = ['week', 'month', 'quarter', 'year']
    if (!validPeriods.includes(period as string)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid period parameter. Must be one of: week, month, quarter, year'
      })
    }

    // Get comprehensive system statistics
    const [adminStats, monthlyStats, departmentStats] = await Promise.all([
      statisticService.getAdminDashboardStats(),
      statisticService.getMonthlyStats(targetYear),
      statisticService.getDepartmentStats()
    ])

    const systemStats = {
      overview: adminStats,
      monthly: monthlyStats,
      departments: departmentStats,
      period: period as string,
      year: targetYear,
      generatedAt: new Date().toISOString()
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'System statistics retrieved successfully',
      data: systemStats
    })
  } catch (error) {
    console.error('Error getting system statistics:', error)
    next(error)
  }
}

export async function getStaffDashboardStatsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { staffId, role } = (req as any).user

    if (!role) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'User authentication required'
      })
    }

    // Get dashboard stats based on role
    let dashboardData
    if (role === 'Quản trị viên' || role === 'Nhân viên') {
      dashboardData = await statisticService.getAdminDashboardStats()
    } else {
      if (!staffId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Staff ID is required for non-admin roles'
        })
      }
      dashboardData = await statisticService.getDoctorDashboardStats(staffId)
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Staff dashboard statistics retrieved successfully',
      data: dashboardData
    })
  } catch (error) {
    console.error('Error getting staff dashboard stats:', error)
    next(error)
  }
}

export async function getAppointmentTrendsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { period = 'month', departmentId, staffId } = req.query

    const validPeriods = ['day', 'week', 'month', 'quarter', 'year']
    if (!validPeriods.includes(period as string)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid period parameter. Must be one of: day, week, month, quarter, year'
      })
    }

    // This would be implemented in the service layer
    // For now, returning a placeholder response
    const trends = {
      period: period as string,
      data: [],
      summary: {
        totalAppointments: 0,
        averagePerPeriod: 0,
        growthRate: 0,
        trends: 'stable'
      }
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Appointment trends retrieved successfully',
      data: trends
    })
  } catch (error) {
    console.error('Error getting appointment trends:', error)
    next(error)
  }
}

export async function getRevenueAnalyticsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { fromDate, toDate, departmentId, serviceId } = req.query

    const parsedFromDate = fromDate ? new Date(fromDate as string) : undefined
    const parsedToDate = toDate ? new Date(toDate as string) : undefined

    // Validate dates if provided
    if (parsedFromDate && isNaN(parsedFromDate.getTime())) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid fromDate parameter'
      })
    }

    if (parsedToDate && isNaN(parsedToDate.getTime())) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid toDate parameter'
      })
    }

    // This would be implemented in the service layer
    // For now, returning a placeholder response
    const analytics = {
      totalRevenue: 0,
      revenueByPeriod: [],
      revenueByDepartment: [],
      revenueByService: [],
      averageRevenuePerAppointment: 0,
      growthRate: 0
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Revenue analytics retrieved successfully',
      data: analytics
    })
  } catch (error) {
    console.error('Error getting revenue analytics:', error)
    next(error)
  }
}

export async function exportStatisticsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { type = 'overview', format = 'json', fromDate, toDate } = req.query

    const validTypes = ['overview', 'appointments', 'revenue', 'staff', 'departments']
    const validFormats = ['json', 'csv', 'excel']

    if (!validTypes.includes(type as string)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid type parameter. Must be one of: overview, appointments, revenue, staff, departments'
      })
    }

    if (!validFormats.includes(format as string)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid format parameter. Must be one of: json, csv, excel'
      })
    }

    // This would implement export functionality
    // For now, returning the data in JSON format
    let data
    switch (type) {
      case 'overview':
        data = await statisticService.getAdminDashboardStats()
        break
      case 'departments':
        data = await statisticService.getDepartmentStats()
        break
      case 'staff':
        data = await statisticService.getStaffPerformanceStats()
        break
      default:
        data = {}
    }

    if (format === 'json') {
      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Statistics exported successfully',
        data: {
          type: type as string,
          format: format as string,
          exportedAt: new Date().toISOString(),
          statistics: data
        }
      })
    }

    // For CSV/Excel export, you would set appropriate headers and return file data
    // This is a placeholder implementation
    return res.status(StatusCodes.NOT_IMPLEMENTED).json({
      success: false,
      message: 'CSV and Excel export not yet implemented'
    })
  } catch (error) {
    console.error('Error exporting statistics:', error)
    next(error)
  }
}
