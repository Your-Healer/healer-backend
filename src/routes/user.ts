import { Router } from 'express'
import { protect } from '~/middlewares/auth'
import { isAdmin, isPatient, isStaff } from '~/middlewares/auth/roles'
import {
  getUserProfileController,
  updateUserProfileController,
  getUserPatientsController,
  getUserStatisticsController,
  deleteUserController,
  searchUsersController,
  getAppointmentHistoryController,
  getUserByIdController,
  getUsersController
} from '~/controllers/user.controller'
import { handleErrors } from '~/middlewares/validation/handleErrors'
// import { userUpdateValidation, patientValidation } from '~/middlewares/validation/userValidation'

const router = Router()

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get user profile
 *     description: Get current user's profile information
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/profile', protect, getUserProfileController)

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update current user's profile information
 *     tags: [User]
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
 *                 example: "John"
 *               lastname:
 *                 type: string
 *                 example: "Doe"
 *               phoneNumber:
 *                 type: string
 *                 example: "0901234567"
 *               address:
 *                 type: string
 *                 example: "123 Main St, City"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', protect, handleErrors, updateUserProfileController)

/**
 * @swagger
 * /users/appointments:
 *   get:
 *     summary: Get user appointments
 *     description: Get appointment history for the current user
 *     tags: [User]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [IDLE, BOOKED, PAID, CANCEL]
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedAppointments'
 */
router.get('/appointments', protect, isPatient, getAppointmentHistoryController)

/**
 * @swagger
 * /users/patients:
 *   get:
 *     summary: Get user patients
 *     description: Get patients associated with the current user
 *     tags: [User]
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
 *     responses:
 *       200:
 *         description: Patients retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedPatients'
 */
router.get('/patients', protect, isPatient, getUserPatientsController)

/**
 * @swagger
 * /users/patients:
 *   post:
 *     summary: Add patient
 *     description: Add a new patient for the current user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatientRequest'
 *     responses:
 *       201:
 *         description: Patient added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 */
// router.post('/patients', protect, isPatient, handleErrors, addPatientController)

/**
 * @swagger
 * /users/statistics:
 *   get:
 *     summary: Get user statistics
 *     description: Get statistics for the current user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserStatistics'
 */
router.get('/statistics', protect, getUserStatisticsController)

/**
 * @swagger
 * /users/activity:
 *   get:
 *     summary: Get user activity
 *     description: Get activity history for the current user
 *     tags: [User]
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
 *     responses:
 *       200:
 *         description: Activity retrieved successfully
 */
// router.get('/activity', protect, getUserActivityController)

/**
 * @swagger
 * /users/preferences:
 *   put:
 *     summary: Update user preferences
 *     description: Update user preferences and settings
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserPreferences'
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 */
// router.put('/preferences', protect, updateUserPreferencesController)

// Admin routes
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Get all users (admin only)
 *     tags: [User, Admin]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: hasAppointments
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedUsers'
 */
// router.get('/', protect, isAdmin, getAllUsersController)

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Search users
 *     description: Search users by various criteria (admin only)
 *     tags: [User, Admin]
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
router.get('/search', protect, isAdmin, searchUsersController)

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Delete a user account (admin only)
 *     tags: [User, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete('/:id', protect, isAdmin, deleteUserController)

export default router
