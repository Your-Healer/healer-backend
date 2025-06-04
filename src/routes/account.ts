import { Router } from 'express'
import { protect } from '~/middlewares/auth'
import { isAdmin } from '~/middlewares/auth/roles'
import {
  createAccountController,
  getAccountByIdController,
  getAccountByUsernameController,
  getAccountByEmailController,
  updateAccountController,
  changePasswordController,
  resetPasswordController,
  verifyEmailController,
  getAccountsController,
  deleteAccountController,
  getAccountStatisticsController,
  checkAccountExistsController,
  updateAvatarController,
  removeAvatarController,
  getWalletInfoController,
  regenerateWalletController,
  searchAccountsController,
  getAccountActivityController,
  bulkUpdateAccountsController,
  bulkDeleteAccountsController
} from '~/controllers/account.controller'
import { handleErrors } from '~/middlewares/validation/handleErrors'
import {
  accountValidation,
  updateAccountValidation,
  changePasswordValidation,
  resetPasswordValidation
} from '~/middlewares/validation/accountValidation'

const router = Router()

// Public routes
router.post('/check-exists', checkAccountExistsController)
router.post('/reset-password', resetPasswordValidation, handleErrors, resetPasswordController)

// Protected routes - User access
router.get('/me', protect, getAccountByIdController)
router.patch('/me', protect, updateAccountValidation, handleErrors, updateAccountController)
router.patch('/me/password', protect, changePasswordValidation, handleErrors, changePasswordController)
router.patch('/me/avatar', protect, updateAvatarController)
router.delete('/me/avatar', protect, removeAvatarController)
router.get('/me/wallet', protect, getWalletInfoController)
router.post('/me/wallet/regenerate', protect, regenerateWalletController)

// Protected routes - Admin access
router.post('/', protect, isAdmin, accountValidation, handleErrors, createAccountController)
router.get('/', protect, isAdmin, getAccountsController)
router.get('/statistics', protect, isAdmin, getAccountStatisticsController)
router.get('/username/:username', protect, isAdmin, getAccountByUsernameController)
router.get('/email/:email', protect, isAdmin, getAccountByEmailController)
router.get('/:id', protect, isAdmin, getAccountByIdController)
router.patch('/:id', protect, isAdmin, updateAccountValidation, handleErrors, updateAccountController)
router.patch('/:id/verify-email', protect, isAdmin, verifyEmailController)
router.delete('/:id', protect, isAdmin, deleteAccountController)
router.get('/search', protect, isAdmin, searchAccountsController)
router.get('/:id/activity', protect, isAdmin, getAccountActivityController)
router.patch('/bulk-update', protect, isAdmin, bulkUpdateAccountsController)
router.delete('/bulk-delete', protect, isAdmin, bulkDeleteAccountsController)

export default router
