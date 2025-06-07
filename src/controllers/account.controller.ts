import { Request, Response, NextFunction } from 'express'
import AccountService from '~/services/account.service'
import {
  CheckAccountExistsDto,
  CreateAccountDto,
  UpdateAccountDto,
  ChangePasswordDto,
  GetAccountByEmailDto,
  GetAccountByUsernameDto,
  AccountFilter,
  GetAccountsDto,
  ResetPasswordDto
} from '~/dtos/account.dto'

const accountService = AccountService.getInstance()

export async function checkAccountExistsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const data: CheckAccountExistsDto = req.body
    const result = await accountService.checkAccountExists(data)
    return res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function resetPasswordController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { email, newPassword } = req.body
    await accountService.resetPassword({
      email,
      newPassword
    })
    return res.status(200).json({ message: 'Password reset successfully' })
  } catch (error) {
    next(error)
  }
}

export async function getMyAccountController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountId } = (req as any).user
    const account = await accountService.getAccountById(accountId)
    return res.status(200).json({ account })
  } catch (error) {
    next(error)
  }
}

export async function updateMyAccountController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountId } = (req as any).user
    const data: UpdateAccountDto = req.body
    const account = await accountService.updateAccount(accountId, data)
    return res.status(200).json({
      message: 'Account updated successfully',
      account
    })
  } catch (error) {
    next(error)
  }
}

export async function changeMyPasswordController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountId } = (req as any).user
    const data: ChangePasswordDto = req.body
    await accountService.changePassword(accountId, data)
    return res.status(200).json({ message: 'Password changed successfully' })
  } catch (error) {
    next(error)
  }
}

export async function updateMyAvatarController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountId } = (req as any).user
    const { avatarId } = req.body
    await accountService.updateAvatar(accountId, avatarId)
    return res.status(200).json({
      message: 'Avatar updated successfully',
      avatarId
    })
  } catch (error) {
    next(error)
  }
}

export async function removeMyAvatarController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountId } = (req as any).user
    await accountService.removeAvatar(accountId)
    return res.status(200).json({ message: 'Avatar removed successfully' })
  } catch (error) {
    next(error)
  }
}

export async function getMyWalletController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountId } = (req as any).user
    const wallet = await accountService.getWalletInfo(accountId)
    return res.status(200).json(wallet)
  } catch (error) {
    next(error)
  }
}

export async function regenerateMyWalletController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountId } = (req as any).user
    const wallet = await accountService.regenerateWallet(accountId)
    return res.status(200).json({
      message: 'Wallet regenerated successfully',
      wallet
    })
  } catch (error) {
    next(error)
  }
}

export async function getAllAccountsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { page = 1, limit = 10, roleId, emailIsVerified, searchTerm } = req.query
    const result = await accountService.getAccounts({
      filter: {
        roleId: roleId as string,
        emailIsVerified: emailIsVerified === 'true' ? true : emailIsVerified === 'false' ? false : undefined,
        searchTerm: searchTerm as string
      } as AccountFilter,
      page: Number(page),
      limit: Number(limit)
    })
    return res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function createAccountController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const data: CreateAccountDto = req.body
    const account = await accountService.createAccount(data)
    return res.status(201).json({
      message: 'Account created successfully',
      account
    })
  } catch (error) {
    next(error)
  }
}

export async function getAccountStatisticsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const statistics = await accountService.getAccountStatistics()
    return res.status(200).json({ statistics })
  } catch (error) {
    next(error)
  }
}

export async function getAccountByUsernameController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { username } = req.params
    const account = await accountService.getAccountByUsername({
      username
    })
    return res.status(200).json({ account })
  } catch (error) {
    next(error)
  }
}

export async function getAccountByEmailController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { email } = req.params
    const account = await accountService.getAccountByEmail({
      email
    })
    return res.status(200).json({ account })
  } catch (error) {
    next(error)
  }
}

export async function getAccountByIdController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const account = await accountService.getAccountById(id)
    return res.status(200).json({ account })
  } catch (error) {
    next(error)
  }
}

export async function updateAccountByIdController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const data: UpdateAccountDto = req.body
    const account = await accountService.updateAccount(id, data)
    return res.status(200).json({
      message: 'Account updated successfully',
      account
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteAccountByIdController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    await accountService.deleteAccount(id)
    return res.status(200).json({ message: 'Account deleted successfully' })
  } catch (error) {
    next(error)
  }
}

export async function verifyEmailController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    await accountService.verifyEmail(id)
    return res.status(200).json({
      message: 'Email verified successfully',
      emailIsVerified: true
    })
  } catch (error) {
    next(error)
  }
}
