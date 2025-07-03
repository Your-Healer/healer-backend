import { Router } from 'express'
import { protect } from '~/middlewares/auth/index'
import { isAdmin, isStaff } from '~/middlewares/auth/roles'
import {
  exportStatisticsController,
  getAdminDashboardStatsController,
  getAppointmentTrendsController,
  getDepartmentStatsController,
  getDoctorDashboardStatsController,
  getMyDoctorStatsController,
  // getMonthlyStatsController,
  getRevenueAnalyticsController,
  getStaffPerformanceStatsController,
  getTimeSlotUtilizationController,
  getStaffDashboardStatsController
  // getSystemStatisticsController
} from '../controllers/statistic.controller'

const router = Router()

router.get('/admin/dashboard', protect, getAdminDashboardStatsController)

router.get('/doctor/dashboard', protect, getDoctorDashboardStatsController)

router.get('/doctor/my-dashboard', protect, getMyDoctorStatsController)

// router.get('/monthly', protect, getMonthlyStatsController)

router.get('/departments', protect, getDepartmentStatsController)

router.get('/staff-performance', protect, getStaffPerformanceStatsController)

router.get('/time-slot-utilization', protect, getTimeSlotUtilizationController)

export default router
