import { Router } from 'express'
import { protect } from '~/middlewares/auth/index'
import { isAdmin } from '~/middlewares/auth/roles'
import multer from 'multer'
import {
  checkAccountExistsController,
  resetPasswordController,
  getMyAccountController,
  updateMyAccountController,
  changeMyPasswordController,
  updateMyAvatarController,
  removeMyAvatarController,
  getMyWalletController,
  regenerateMyWalletController,
  getAllAccountsController,
  createAccountController,
  getAccountStatisticsController,
  getAccountByUsernameController,
  getAccountByEmailController,
  getAccountByIdController,
  updateAccountByIdController,
  deleteAccountByIdController,
  verifyEmailController
} from '~/controllers/account.controller'

const router = Router()
const storage = multer.memoryStorage()
const upload = multer({ storage })

// Public routes
router.post('/check-exists', checkAccountExistsController)
router.post('/reset-password', resetPasswordController)

// Protected routes - User access
router.get('/me', protect, getMyAccountController)
router.patch('/me', protect, updateMyAccountController)
router.patch('/me/password', protect, changeMyPasswordController)
router.patch('/me/avatar', protect, upload.single('file'), updateMyAvatarController)
router.delete('/me/avatar', protect, removeMyAvatarController)
router.get('/me/wallet', protect, getMyWalletController)
router.post('/me/wallet/regenerate', protect, regenerateMyWalletController)

// Protected routes - Admin access
router.get('/', protect, getAllAccountsController)
router.post('/', protect, createAccountController)
router.get('/statistics', protect, getAccountStatisticsController)
router.get('/username/:username', protect, getAccountByUsernameController)
router.get('/email/:email', protect, getAccountByEmailController)
router.get('/:id', protect, getAccountByIdController)
router.patch('/:id', protect, updateAccountByIdController)
router.delete('/:id', protect, deleteAccountByIdController)
router.patch('/:id/verify-email', protect, verifyEmailController)

export default router
