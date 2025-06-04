import { NextFunction, Request, Response } from 'express'
import AccountService from '~/services/account.service'

const accountService = AccountService.getInstance()

export async function createAccountController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { roleId, username, password, email, phoneNumber, avatarId } = req.body

    const account = await accountService.createAccount({
      roleId,
      username,
      password,
      email,
      phoneNumber,
      avatarId
    })

    // Remove sensitive data from response
    const { password: _, walletMnemonic: __, ...safeAccount } = account

    return res.status(201).json({
      message: 'Account created successfully',
      account: safeAccount
    })
  } catch (error: any) {
    console.error('Error creating account:', error)
    return res.status(400).json({ error: error.message || 'Failed to create account' })
  }
}

export async function getAccountByIdController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const accountId = id || (req as any).user?.accountId

    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' })
    }

    const account = await accountService.getAccountById(accountId)
    if (!account) {
      return res.status(404).json({ error: 'Account not found' })
    }

    // Remove sensitive data
    const { password, walletMnemonic, ...safeAccount } = account

    return res.status(200).json({
      account: safeAccount
    })
  } catch (error: any) {
    console.error('Error getting account:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getAccountByUsernameController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { username } = req.params

    const account = await accountService.getAccountByUsername(username)
    if (!account) {
      return res.status(404).json({ error: 'Account not found' })
    }

    // Remove sensitive data
    const { password, walletMnemonic, ...safeAccount } = account

    return res.status(200).json({
      account: safeAccount
    })
  } catch (error: any) {
    console.error('Error getting account by username:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getAccountByEmailController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { email } = req.params

    const account = await accountService.getAccountByEmail(email)
    if (!account) {
      return res.status(404).json({ error: 'Account not found' })
    }

    // Remove sensitive data
    const { password, walletMnemonic, ...safeAccount } = account

    return res.status(200).json({
      account: safeAccount
    })
  } catch (error: any) {
    console.error('Error getting account by email:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function updateAccountController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const accountId = id || (req as any).user?.accountId
    const { username, email, phoneNumber, avatarId, emailIsVerified } = req.body

    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' })
    }

    // Only admins can update emailIsVerified and other accounts
    const isAdmin = (req as any).user?.role === 'Quản trị viên'
    const isOwnAccount = accountId === (req as any).user?.accountId

    if (!isAdmin && !isOwnAccount) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const updateData: any = { username, email, phoneNumber, avatarId }
    if (isAdmin) {
      updateData.emailIsVerified = emailIsVerified
    }

    const account = await accountService.updateAccount(accountId, updateData)

    // Remove sensitive data
    const { password, walletMnemonic, ...safeAccount } = account

    return res.status(200).json({
      message: 'Account updated successfully',
      account: safeAccount
    })
  } catch (error: any) {
    console.error('Error updating account:', error)
    return res.status(400).json({ error: error.message || 'Failed to update account' })
  }
}

export async function changePasswordController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const accountId = id || (req as any).user?.accountId
    const { currentPassword, newPassword } = req.body

    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' })
    }

    // Users can only change their own password
    if (accountId !== (req as any).user?.accountId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    await accountService.changePassword(accountId, {
      currentPassword,
      newPassword
    })

    return res.status(200).json({
      message: 'Password changed successfully'
    })
  } catch (error: any) {
    console.error('Error changing password:', error)
    return res.status(400).json({ error: error.message || 'Failed to change password' })
  }
}

export async function resetPasswordController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { email, newPassword } = req.body

    const account = await accountService.resetPassword(email, newPassword)

    return res.status(200).json({
      message: 'Password reset successfully'
    })
  } catch (error: any) {
    console.error('Error resetting password:', error)
    return res.status(400).json({ error: error.message || 'Failed to reset password' })
  }
}

export async function verifyEmailController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const accountId = id || (req as any).user?.accountId

    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' })
    }

    const account = await accountService.verifyEmail(accountId)

    return res.status(200).json({
      message: 'Email verified successfully',
      emailIsVerified: account.emailIsVerified
    })
  } catch (error: any) {
    console.error('Error verifying email:', error)
    return res.status(400).json({ error: error.message || 'Failed to verify email' })
  }
}

export async function getAccountsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { page = 1, limit = 10, roleId, emailIsVerified, searchTerm } = req.query

    const filter = {
      roleId: roleId as string,
      emailIsVerified: emailIsVerified === 'true' ? true : emailIsVerified === 'false' ? false : undefined,
      searchTerm: searchTerm as string
    }

    const result = await accountService.getAccounts(filter, Number(page), Number(limit))

    // Remove sensitive data from all accounts
    const safeAccounts = result.data.map((account) => {
      const { password, walletMnemonic, ...safeAccount } = account
      return safeAccount
    })

    return res.status(200).json({
      ...result,
      data: safeAccounts
    })
  } catch (error: any) {
    console.error('Error getting accounts:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function deleteAccountController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params

    // Prevent admin from deleting their own account
    if (id === (req as any).user?.accountId) {
      return res.status(400).json({ error: 'Cannot delete your own account' })
    }

    await accountService.deleteAccount(id)

    return res.status(200).json({
      message: 'Account deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting account:', error)
    return res.status(400).json({ error: error.message || 'Failed to delete account' })
  }
}

export async function getAccountStatisticsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const statistics = await accountService.getAccountStatistics()

    return res.status(200).json({
      statistics
    })
  } catch (error: any) {
    console.error('Error getting account statistics:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function checkAccountExistsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { username, email, phoneNumber } = req.body

    if (!username && !email && !phoneNumber) {
      return res.status(400).json({ error: 'At least one field (username, email, phoneNumber) is required' })
    }

    const result = await accountService.checkAccountExists(username, email, phoneNumber)

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error checking account exists:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function updateAvatarController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const accountId = id || (req as any).user?.accountId
    const { avatarId } = req.body

    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' })
    }

    if (!avatarId) {
      return res.status(400).json({ error: 'Avatar ID is required' })
    }

    // Users can only update their own avatar unless they're admin
    const isAdmin = (req as any).user?.role === 'Quản trị viên'
    const isOwnAccount = accountId === (req as any).user?.accountId

    if (!isAdmin && !isOwnAccount) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const account = await accountService.updateAvatar(accountId, avatarId)

    return res.status(200).json({
      message: 'Avatar updated successfully',
      avatarId: account.avatarId
    })
  } catch (error: any) {
    console.error('Error updating avatar:', error)
    return res.status(400).json({ error: error.message || 'Failed to update avatar' })
  }
}

export async function removeAvatarController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const accountId = id || (req as any).user?.accountId

    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' })
    }

    // Users can only remove their own avatar unless they're admin
    const isAdmin = (req as any).user?.role === 'Quản trị viên'
    const isOwnAccount = accountId === (req as any).user?.accountId

    if (!isAdmin && !isOwnAccount) {
      return res.status(403).json({ error: 'Access denied' })
    }

    await accountService.removeAvatar(accountId)

    return res.status(200).json({
      message: 'Avatar removed successfully'
    })
  } catch (error: any) {
    console.error('Error removing avatar:', error)
    return res.status(400).json({ error: error.message || 'Failed to remove avatar' })
  }
}

export async function getWalletInfoController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const accountId = id || (req as any).user?.accountId

    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' })
    }

    // Users can only get their own wallet info unless they're admin
    const isAdmin = (req as any).user?.role === 'Quản trị viên'
    const isOwnAccount = accountId === (req as any).user?.accountId

    if (!isAdmin && !isOwnAccount) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const walletInfo = await accountService.getWalletInfo(accountId)

    // For security, only return wallet address for non-admin users viewing other accounts
    if (!isOwnAccount && !isAdmin) {
      return res.status(200).json({
        walletAddress: walletInfo.walletAddress
      })
    }

    return res.status(200).json(walletInfo)
  } catch (error: any) {
    console.error('Error getting wallet info:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function regenerateWalletController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const accountId = id || (req as any).user?.accountId

    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' })
    }

    // Users can only regenerate their own wallet unless they're admin
    const isAdmin = (req as any).user?.role === 'Quản trị viên'
    const isOwnAccount = accountId === (req as any).user?.accountId

    if (!isAdmin && !isOwnAccount) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const newWallet = await accountService.regenerateWallet(accountId)

    return res.status(200).json({
      message: 'Wallet regenerated successfully',
      wallet: newWallet
    })
  } catch (error: any) {
    console.error('Error regenerating wallet:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function bulkUpdateAccountsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountIds, updateData } = req.body

    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return res.status(400).json({ error: 'Account IDs array is required' })
    }

    let updatedCount = 0
    const errors: string[] = []

    for (const accountId of accountIds) {
      try {
        await accountService.updateAccount(accountId, updateData)
        updatedCount++
      } catch (error: any) {
        errors.push(`Failed to update account ${accountId}: ${error.message}`)
      }
    }

    return res.status(200).json({
      message: `Bulk update completed. ${updatedCount} accounts updated.`,
      updatedCount,
      totalRequested: accountIds.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('Error in bulk update accounts:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function bulkDeleteAccountsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountIds } = req.body

    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return res.status(400).json({ error: 'Account IDs array is required' })
    }

    // Prevent admin from deleting their own account
    if (accountIds.includes((req as any).user?.accountId)) {
      return res.status(400).json({ error: 'Cannot delete your own account' })
    }

    let deletedCount = 0
    const errors: string[] = []

    for (const accountId of accountIds) {
      try {
        await accountService.deleteAccount(accountId)
        deletedCount++
      } catch (error: any) {
        errors.push(`Failed to delete account ${accountId}: ${error.message}`)
      }
    }

    return res.status(200).json({
      message: `Bulk delete completed. ${deletedCount} accounts deleted.`,
      deletedCount,
      totalRequested: accountIds.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('Error in bulk delete accounts:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getAccountActivityController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const accountId = id || (req as any).user?.accountId

    if (!accountId) {
      return res.status(400).json({ error: 'Account ID is required' })
    }

    // For now, return basic activity info
    // In a real implementation, you might have an activity log table
    const account = await accountService.getAccountById(accountId)
    if (!account) {
      return res.status(404).json({ error: 'Account not found' })
    }

    const activity = {
      lastLogin: null,
      emailVerified: account.emailIsVerified,
      profileComplete: !!(account.email && (account.user || account.staff))
    }

    return res.status(200).json({
      activity
    })
  } catch (error: any) {
    console.error('Error getting account activity:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function searchAccountsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { q: searchTerm, page = 1, limit = 10 } = req.query

    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' })
    }

    const filter = { searchTerm: searchTerm as string }
    const result = await accountService.getAccounts(filter, Number(page), Number(limit))

    // Remove sensitive data
    const safeAccounts = result.data.map((account) => {
      const { password, walletMnemonic, ...safeAccount } = account
      return safeAccount
    })

    return res.status(200).json({
      ...result,
      data: safeAccounts
    })
  } catch (error: any) {
    console.error('Error searching accounts:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
