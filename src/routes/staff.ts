import { Router } from 'express'
import { protect } from '~/middlewares/auth'
import { isAdmin, isStaff, isDoctorPosition, isNursePosition } from '~/middlewares/auth/positions'
import {
  getStaffProfileController,
  updateStaffProfileController,
  createStaffController,
  getAllStaffController,
  getStaffByIdController,
  deleteStaffController,
  getStaffShiftsController,
  getStaffAppointmentsController,
  getStaffStatisticsController,
  searchStaffController,
  getStaffByDepartmentController
} from '~/controllers/staff.controller'
import { handleErrors } from '~/middlewares/validation/handleErrors'
import { staffCreationValidation, staffUpdateValidation } from '~/middlewares/validation/staffValidation'

const router = Router()

/**
 * @swagger
 * /staff/profile:
 *   get:
 *     summary: Get staff profile
 *     description: Get current staff member's profile
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StaffProfile'
 */
router.get('/profile', protect, isStaff, getStaffProfileController)

/**
 * @swagger
 * /staff/profile:
 *   put:
 *     summary: Update staff profile
 *     description: Update current staff member's profile
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               introduction:
 *                 type: string
 *               educationLevel:
 *                 type: string
 *                 enum: [DIPLOMA, ASSOCIATE, BACHELOR, MASTER, PROFESSIONAL]
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', protect, isStaff, staffUpdateValidation, handleErrors, updateStaffProfileController)

/**
 * @swagger
 * /staff/shifts:
 *   get:
 *     summary: Get staff shifts
 *     description: Get shifts for the authenticated staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Shifts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Shift'
 */
router.get('/shifts', protect, isStaff, getStaffShiftsController)

/**
 * @swagger
 * /staff/appointments:
 *   get:
 *     summary: Get staff appointments
 *     description: Get appointments for the authenticated staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [IDLE, BOOKED, PAID, CANCEL]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 */
router.get('/appointments', protect, isStaff, getStaffAppointmentsController)

/**
 * @swagger
 * /staff/statistics:
 *   get:
 *     summary: Get staff statistics
 *     description: Get statistics for the authenticated staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StaffStatistics'
 */
router.get('/statistics', protect, isStaff, getStaffStatisticsController)

/**
 * @swagger
 * /staff:
 *   get:
 *     summary: Get all staff
 *     description: Get all staff members (admin only)
 *     tags: [Staff, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: positionId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedStaff'
 */
router.get('/', protect, isAdmin, getAllStaffController)

/**
 * @swagger
 * /staff:
 *   post:
 *     summary: Create staff member
 *     description: Create a new staff member (admin only)
 *     tags: [Staff, Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StaffRegistration'
 *     responses:
 *       201:
 *         description: Staff created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StaffProfile'
 */
router.post('/', protect, isAdmin, staffCreationValidation, handleErrors, createStaffController)

/**
 * @swagger
 * /staff/search:
 *   get:
 *     summary: Search staff
 *     description: Search staff by various criteria
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get('/search', protect, isStaff, searchStaffController)

/**
 * @swagger
 * /staff/department/{departmentId}:
 *   get:
 *     summary: Get staff by department
 *     description: Get all staff members in a specific department
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Staff retrieved successfully
 */
router.get('/department/:departmentId', protect, isStaff, getStaffByDepartmentController)

/**
 * @swagger
 * /staff/{id}:
 *   get:
 *     summary: Get staff by ID
 *     description: Get staff member details by ID
 *     tags: [Staff]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff ID
 *     responses:
 *       200:
 *         description: Staff retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StaffProfile'
 *       404:
 *         description: Staff not found
 */
router.get('/:id', getStaffByIdController)

/**
 * @swagger
 * /staff/{id}:
 *   delete:
 *     summary: Delete staff member
 *     description: Delete a staff member (admin only)
 *     tags: [Staff, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff ID
 *     responses:
 *       200:
 *         description: Staff deleted successfully
 *       404:
 *         description: Staff not found
 */
router.delete('/:id', protect, isAdmin, deleteStaffController)

export default router
