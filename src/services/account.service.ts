import { Account, Attachment, Prisma } from '@prisma/client'
import BaseService from './base.service'
import { createHashedPassword, compareHashedPassword } from '~/middlewares/auth/index'
import BlockchainService from './blockchain.service'
import cryptoJs from 'crypto-js'
import prisma from '~/libs/prisma/init'
import {
  ChangePasswordDto,
  CheckAccountExistsDto,
  CreateAccountDto,
  GetAccountByEmailDto,
  GetAccountByUsernameDto,
  GetAccountsDto,
  ResetPasswordDto,
  UpdateAccountDto
} from '~/dtos/account.dto'
import { decryptString, encryptString } from '~/utils/helpers'
import config from '~/configs/env/index'
import AttachmentService from './attachment.service'

const SECRET_KEY = config.secrets.secretKey

export default class AccountService extends BaseService {
  private static blockchainService: BlockchainService
  private attachmentService: AttachmentService
  private static instance: AccountService

  static getInstance(): AccountService {
    if (!AccountService.instance) {
      AccountService.instance = new AccountService(BlockchainService.getInstance())
    }
    return AccountService.instance
  }

  private constructor(private blockchainService: BlockchainService) {
    super()
    this.blockchainService = blockchainService
    this.attachmentService = AttachmentService.getInstance()
  }

  async createAccount(data: CreateAccountDto): Promise<Account> {
    try {
      // Check if username already exists
      const existingUsername = await prisma.account.findUnique({
        where: { username: data.username }
      })
      if (existingUsername) {
        throw new Error('Username already exists')
      }

      // Check if email already exists
      if (data.email) {
        const existingEmail = await prisma.account.findUnique({
          where: { email: data.email }
        })
        if (existingEmail) {
          throw new Error('Email already exists')
        }
      }

      // Check if phone number already exists
      if (data.phoneNumber) {
        const existingPhone = await prisma.account.findFirst({
          where: { phoneNumber: data.phoneNumber }
        })
        if (existingPhone) {
          throw new Error('Phone number already exists')
        }
      }

      // Hash password
      const hashedPassword = await createHashedPassword(data.password)

      const wallet = await this.blockchainService.createNewWallet()
      const walletAddress = wallet.pair.address

      // Encrypt mnemonic
      const walletMnemonic = encryptString(wallet.mnemonic, SECRET_KEY)

      const accountData: Prisma.AccountCreateInput = {
        role: { connect: { id: data.roleId } },
        username: data.username,
        password: hashedPassword,
        email: data.email,
        phoneNumber: data.phoneNumber,
        walletAddress,
        walletMnemonic,
        emailIsVerified: false
      }

      const account = await prisma.account.create({
        data: accountData
      })

      await this.blockchainService.forceSetBalance(walletAddress, BigInt(1000000000))

      return account
    } catch (error) {
      this.handleError(error, 'createAccount')
    }
  }

  async getAccountById(id: string) {
    try {
      return await prisma.account.findUnique({
        where: { id },
        include: {
          role: true,
          avatar: true,
          user: true,
          staff: {
            include: {
              positions: {
                include: {
                  position: true
                }
              },
              departments: {
                include: {
                  department: true
                }
              },
              shifts: {
                select: {
                  id: true,
                  fromTime: true,
                  toTime: true,
                  room: true,
                  roomId: true,
                  staffId: true,
                  staff: true
                },
                orderBy: {
                  fromTime: 'desc'
                }
              }
            }
          }
        }
      })
    } catch (error) {
      this.handleError(error, 'getAccountById')
    }
  }

  async getAccountByUsername(data: GetAccountByUsernameDto) {
    try {
      return await prisma.account.findUnique({
        where: { username: data.username },
        include: {
          role: true,
          avatar: true,
          user: true,
          staff: {
            include: {
              positions: {
                include: {
                  position: true
                }
              }
            }
          }
        }
      })
    } catch (error) {
      this.handleError(error, 'getAccountByUsername')
    }
  }

  async getAccountByEmail(data: GetAccountByEmailDto) {
    try {
      return await prisma.account.findUnique({
        where: { email: data.email },
        include: {
          role: true,
          avatar: true,
          user: true,
          staff: {
            include: {
              positions: {
                include: {
                  position: true
                }
              }
            }
          }
        }
      })
    } catch (error) {
      this.handleError(error, 'getAccountByEmail')
    }
  }

  async updateAccount(id: string, data: UpdateAccountDto): Promise<Account> {
    try {
      // Check if account exists
      const existingAccount = await prisma.account.findUnique({
        where: { id }
      })
      if (!existingAccount) {
        throw new Error('Account not found')
      }

      // Check username uniqueness if updating
      if (data.username && data.username !== existingAccount.username) {
        const usernameExists = await prisma.account.findUnique({
          where: { username: data.username }
        })
        if (usernameExists) {
          throw new Error('Username already exists')
        }
      }

      // Check email uniqueness if updating
      if (data.email && data.email !== existingAccount.email) {
        const emailExists = await prisma.account.findUnique({
          where: { email: data.email }
        })
        if (emailExists) {
          throw new Error('Email already exists')
        }
      }

      // Check phone uniqueness if updating
      if (data.phoneNumber && data.phoneNumber !== existingAccount.phoneNumber) {
        const phoneExists = await prisma.account.findFirst({
          where: { phoneNumber: data.phoneNumber }
        })
        if (phoneExists) {
          throw new Error('Phone number already exists')
        }
      }

      const updateData: Prisma.AccountUpdateInput = {
        username: data.username,
        email: data.email,
        phoneNumber: data.phoneNumber,
        avatar: data.avatarId ? { connect: { id: data.avatarId } } : undefined,
        emailIsVerified: data.emailIsVerified
      }

      return await prisma.account.update({
        where: { id },
        data: updateData
      })
    } catch (error) {
      this.handleError(error, 'updateAccount')
    }
  }

  async changePassword(id: string, data: ChangePasswordDto): Promise<Account> {
    try {
      const account = await prisma.account.findUnique({
        where: { id }
      })
      if (!account) {
        throw new Error('Account not found')
      }

      // Verify current password
      const isCurrentPasswordValid = await compareHashedPassword(data.currentPassword, account.password)
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect')
      }

      // Hash new password
      const hashedNewPassword = await createHashedPassword(data.newPassword)

      return await prisma.account.update({
        where: { id },
        data: { password: hashedNewPassword }
      })
    } catch (error) {
      this.handleError(error, 'changePassword')
    }
  }

  async resetPassword(data: ResetPasswordDto): Promise<Account> {
    try {
      const account = await prisma.account.findUnique({
        where: { email: data.email }
      })
      if (!account) {
        throw new Error('Account with this email not found')
      }

      const hashedPassword = await createHashedPassword(data.newPassword)
      return await prisma.account.update({
        where: { id: account.id },
        data: { password: hashedPassword }
      })
    } catch (error) {
      this.handleError(error, 'resetPassword')
    }
  }

  async verifyEmail(id: string): Promise<Account> {
    try {
      return await prisma.account.update({
        where: { id },
        data: { emailIsVerified: true }
      })
    } catch (error) {
      this.handleError(error, 'verifyEmail')
    }
  }

  async getAccounts(data: GetAccountsDto) {
    try {
      const { skip, take } = this.calculatePagination(data.page, data.limit)

      const where: any = {}

      if (data.filter.roleId) where.roleId = data.filter.roleId
      if (data.filter.emailIsVerified !== undefined) where.emailIsVerified = data.filter.emailIsVerified

      if (data.filter.searchTerm) {
        where.OR = [
          { username: { contains: data.filter.searchTerm, mode: 'insensitive' } },
          { email: { contains: data.filter.searchTerm, mode: 'insensitive' } },
          { phoneNumber: { contains: data.filter.searchTerm, mode: 'insensitive' } },
          { user: { firstname: { contains: data.filter.searchTerm, mode: 'insensitive' } } },
          { user: { lastname: { contains: data.filter.searchTerm, mode: 'insensitive' } } },
          { staff: { firstname: { contains: data.filter.searchTerm, mode: 'insensitive' } } },
          { staff: { lastname: { contains: data.filter.searchTerm, mode: 'insensitive' } } }
        ]
      }

      const include = {
        role: true,
        avatar: true,
        user: true,
        staff: {
          include: {
            positions: {
              include: {
                position: true
              }
            }
          }
        }
      }

      const [accounts, total] = await Promise.all([
        prisma.account.findMany({
          skip,
          take,
          where,
          include
        }),
        prisma.account.count({ where })
      ])

      return this.formatPaginationResult(accounts, total, data.page, data.limit)
    } catch (error) {
      this.handleError(error, 'getAccounts')
    }
  }

  async deleteAccount(id: string): Promise<void> {
    try {
      const account = await prisma.account.findUnique({
        where: { id },
        include: {
          user: true,
          staff: true
        }
      })
      if (!account) {
        throw new Error('Account not found')
      }

      // Delete related records first
      if (account.user) {
        // Delete user and related data
        await prisma.user.delete({
          where: { id: account.user.id }
        })
      }

      if (account.staff) {
        // Delete staff and related data
        await prisma.staff.delete({
          where: { id: account.staff.id }
        })
      }

      // Finally delete the account
      await prisma.account.delete({
        where: { id }
      })
    } catch (error) {
      this.handleError(error, 'deleteAccount')
    }
  }

  async getAccountStatistics() {
    try {
      const [totalAccounts, verifiedAccounts, userAccounts, staffAccounts, adminAccounts] = await Promise.all([
        prisma.account.count(),
        prisma.account.count({ where: { emailIsVerified: true } }),
        prisma.account.count({ where: { role: { name: 'Người dùng' } } }),
        prisma.account.count({ where: { role: { name: 'Nhân viên' } } }),
        prisma.account.count({ where: { role: { name: 'Quản trị viên' } } })
      ])

      const verificationRate = totalAccounts > 0 ? (verifiedAccounts / totalAccounts) * 100 : 0

      return {
        totalAccounts,
        verifiedAccounts,
        unverifiedAccounts: totalAccounts - verifiedAccounts,
        userAccounts,
        staffAccounts,
        adminAccounts,
        verificationRate: Math.round(verificationRate * 100) / 100
      }
    } catch (error) {
      this.handleError(error, 'getAccountStatistics')
    }
  }

  async checkAccountExists(data: CheckAccountExistsDto): Promise<{
    usernameExists: boolean
    emailExists: boolean
    phoneExists: boolean
  }> {
    try {
      const [usernameCheck, emailCheck, phoneCheck] = await Promise.all([
        prisma.account.findUnique({
          where: { username: data.username }
        }),
        data.email ? prisma.account.findUnique({ where: { email: data.email } }) : null,
        data.phoneNumber ? prisma.account.findMany({ where: { phoneNumber: data.phoneNumber }, take: 1 }) : []
      ])

      return {
        usernameExists: !!usernameCheck,
        emailExists: !!emailCheck,
        phoneExists: Array.isArray(phoneCheck) ? phoneCheck.length > 0 : false
      }
    } catch (error) {
      this.handleError(error, 'checkAccountExists')
    }
  }

  async updateAvatar(id: string, file: Express.Multer.File): Promise<Account> {
    try {
      const attachment = await this.attachmentService.uploadSingleFile(file)
      const updateData: Prisma.AccountUpdateInput = {
        avatar: { connect: { id: attachment.attachment.id } }
      }
      return await prisma.account.update({
        where: { id },
        data: updateData
      })
    } catch (error) {
      this.handleError(error, 'updateAvatar')
    }
  }

  async removeAvatar(id: string): Promise<Account> {
    try {
      const updateData: Prisma.AccountUpdateInput = {
        avatar: { disconnect: true }
      }
      return await prisma.account.update({
        where: { id },
        data: updateData
      })
    } catch (error) {
      this.handleError(error, 'removeAvatar')
    }
  }

  async getWalletInfo(id: string) {
    try {
      const account = await prisma.account.findUnique({
        where: { id }
      })
      if (!account) {
        throw new Error('Account not found')
      }

      // Decrypt mnemonic
      let decryptedMnemonic = ''
      if (account.walletMnemonic) {
        decryptedMnemonic = decryptString(account.walletMnemonic, SECRET_KEY)
      }

      return {
        walletAddress: account.walletAddress,
        walletMnemonic: decryptedMnemonic
      }
    } catch (error) {
      this.handleError(error, 'getWalletInfo')
    }
  }

  async regenerateWallet(id: string): Promise<{ walletAddress: string; walletMnemonic: string }> {
    try {
      const wallet = await this.blockchainService.createNewWallet()

      const encryptedMnemonic = encryptString(wallet.mnemonic, SECRET_KEY)

      const updateData: Prisma.AccountUpdateInput = {
        walletAddress: wallet.pair.address,
        walletMnemonic: encryptedMnemonic
      }

      await prisma.account.update({
        where: { id },
        data: updateData
      })

      return {
        walletAddress: wallet.pair.address,
        walletMnemonic: wallet.mnemonic
      }
    } catch (error) {
      this.handleError(error, 'regenerateWallet')
    }
  }
}
