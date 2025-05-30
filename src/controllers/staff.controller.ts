import { NextFunction, Response } from 'express'
import cryptoJs from 'crypto-js'

import prisma from '~/libs/prisma/init'
import { createHashedPassword } from '~/middlewares/auth'
import StaffService from '~/services/staff.service'
import WalletService from '~/services/wallet.service'
import config from '~/configs/env'

const staffService = StaffService.getInstance()
const walletService = WalletService.getInstance()

export const createStaffController = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const {
      username,
      password,
      email,
      phoneNumber,
      firstname,
      lastname,
      positionIds,
      departmentIds,
      introduction,
      educationLevel
    } = req.body

    const staffRole = await prisma.role.findFirst({
      where: {
        name: 'Staff'
      }
    })

    if (!staffRole) {
      return res.status(400).json({ message: 'Staff role not found' })
    }

    // Create wallet if needed
    let walletAddress = null
    let encryptedMnemonic = null

    const { mnemonic, isValidMnemonic, pair } = await walletService.createNewWallet()

    if (!mnemonic || !isValidMnemonic) {
      return res.status(400).json({ error: 'Failed to create wallet' })
    }

    walletAddress = pair.address
    encryptedMnemonic = cryptoJs.AES.encrypt(mnemonic, config.secrets.secretKey).toString()

    const { account, staff } = await staffService.createNewStaff({
      roleId: staffRole.id,
      username,
      password,
      email,
      firstname,
      lastname,
      walletAddress,
      walletMnemonic: encryptedMnemonic,
      phoneNumber,
      introduction,
      educationLevel,
      positionIds,
      departmentIds
    })

    return res.status(201).json({
      message: 'Staff created successfully',
      staff: {
        id: staff.id,
        firstname: staff.firstname,
        lastname: staff.lastname,
        email: account.email
      }
    })
  } catch (error) {
    console.error('Error creating staff:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getStaffProfileController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.params
    const staff = await staffService.getStaffById(id)

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' })
    }

    return res.status(200).json(staff)
  } catch (error) {
    console.error('Error fetching staff profile:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getStaffShiftsController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const { id } = req.user
    const staffMember = await staffService.getStaffByAccountId(req.user.accountId)

    if (!staffMember) {
      return res.status(404).json({ message: 'Staff not found' })
    }

    // Parse date range from query params
    const fromDate = req.query.from ? new Date(req.query.from) : undefined
    const toDate = req.query.to ? new Date(req.query.to) : undefined

    const shifts = await staffService.getStaffShifts(staffMember.id, fromDate, toDate)

    return res.status(200).json(shifts)
  } catch (error) {
    console.error('Error fetching staff shifts:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getStaffPatientsController(req: any, res: Response, next: NextFunction): Promise<any> {
  try {
    const staffMember = await staffService.getStaffByAccountId(req.user.accountId)

    if (!staffMember) {
      return res.status(404).json({ message: 'Staff not found' })
    }

    // Parse date from query params
    const date = req.query.date ? new Date(req.query.date) : undefined

    const patients = await staffService.getStaffPatients(staffMember.id, date)

    return res.status(200).json(patients)
  } catch (error) {
    console.error('Error fetching staff patients:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
