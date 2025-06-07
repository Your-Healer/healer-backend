import { Router } from 'express'
import { protect } from '~/middlewares/auth/index'
import { isAdmin } from '~/middlewares/auth/roles'
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

// Public routes
router.post('/check-exists', checkAccountExistsController)
router.post('/reset-password', resetPasswordController)

// Protected routes - User access
router.get('/me', protect, getMyAccountController)
router.patch('/me', protect, updateMyAccountController)
router.patch('/me/password', protect, changeMyPasswordController)
router.patch('/me/avatar', protect, updateMyAvatarController)
router.delete('/me/avatar', protect, removeMyAvatarController)
router.get('/me/wallet', protect, getMyWalletController)
router.post('/me/wallet/regenerate', protect, regenerateMyWalletController)

// Protected routes - Admin access
router.get('/', protect, isAdmin, getAllAccountsController)
router.post('/', protect, isAdmin, createAccountController)
router.get('/statistics', protect, isAdmin, getAccountStatisticsController)
router.get('/username/:username', protect, isAdmin, getAccountByUsernameController)
router.get('/email/:email', protect, isAdmin, getAccountByEmailController)
router.get('/:id', protect, isAdmin, getAccountByIdController)
router.patch('/:id', protect, isAdmin, updateAccountByIdController)
router.delete('/:id', protect, isAdmin, deleteAccountByIdController)
router.patch('/:id/verify-email', protect, isAdmin, verifyEmailController)

export default router
