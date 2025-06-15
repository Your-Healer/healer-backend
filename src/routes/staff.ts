import { Router } from 'express'
import { protect } from '~/middlewares/auth/index'
import { isAdmin, isStaff } from '~/middlewares/auth/roles'
import {
  createStaffController,
  getAllStaffController,
  getStaffByIdController,
  updateStaffController,
  deleteStaffController,
  searchStaffController,
  getStaffProfileController,
  updateStaffProfileController,
  getStaffShiftsController,
  getStaffAppointmentsController,
  getStaffStatisticsController,
  getStaffWorkloadController,
  bulkAssignStaffController,
  bulkUpdateStaffController,
  getStaffByDepartmentController,
  getStaffByPositionController,
  getStaffPatientsController,
  getStaffScheduleController,
  getIndividualStaffWorkloadController
} from '~/controllers/staff.controller'
import { handleErrors } from '~/middlewares/validation/handleErrors'

const router = Router()

// Public routes
router.get('/:id', getStaffByIdController)

// Protected routes - Staff access
router.get('/profile', protect, getStaffProfileController)
router.put('/profile', protect, updateStaffProfileController)
router.get('/shifts', protect, getStaffShiftsController)
router.get('/appointments', protect, getStaffAppointmentsController)
router.get('/search', protect, searchStaffController)

// Protected routes - Admin access
router.get('/', protect, getAllStaffController)
router.post('/', protect, handleErrors, createStaffController)
router.patch('/:id', protect, updateStaffController)
router.delete('/:id', protect, deleteStaffController)
router.get('/statistics', protect, getStaffStatisticsController)
router.get('/workload', protect, getStaffWorkloadController)
router.post('/bulk-assign', protect, bulkAssignStaffController)
router.patch('/bulk-update', protect, bulkUpdateStaffController)

// Department and position specific routes
router.get('/departments/:departmentId', getStaffByDepartmentController)
router.get('/positions/:positionId', getStaffByPositionController)

// Individual staff routes
router.get('/:id/patients', protect, getStaffPatientsController)
router.get('/:id/schedule', protect, getStaffScheduleController)
router.get('/:id/workload', protect, getIndividualStaffWorkloadController)

export default router
