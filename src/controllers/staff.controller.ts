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
    const { username, password, email, phoneNumber, firstname, lastname, positionIds, departmentIds } = req.body

    const staffRole = await prisma.role.findFirst({
      where: {
        name: 'Staff'
      }
    })

    if (!staffRole) {
      return res.status(400).json({ message: 'Staff role not found' })
    }

    const hashedPassword = await createHashedPassword(password)
    const { mnemonic, isValidMnemonic, keyring, pair } = await walletService.createNewWallet()
    const address = pair.address
    const encryptedMnemonic = cryptoJs.AES.encrypt(mnemonic, config.secrets.secretKey).toString()

    const { account, staff } = await staffService.createNewStaff({
      roleId: staffRole.id,
      username,
      password,
      email,
      firstname,
      lastname,
      walletAddress: null,
      walletMnemonic: null,
      phoneNumber,
      positionIds,
      departmentIds
    })
  } catch (error) {
    console.error('Error login:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
