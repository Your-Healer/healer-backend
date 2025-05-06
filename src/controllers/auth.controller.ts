import { NextFunction, Request, Response } from 'express'
import prisma from '~/libs/prisma/init'
import { createHashedPassword } from '~/middlewares/auth'
import WalletService from '~/services/wallet.service'
import cryptoJs from 'crypto-js'
import config from '~/configs/env'
import { AuthService } from '~/services/auth.service'
import { Account, User } from '~/generated/prisma/client'

const walletService = WalletService.getInstance()
const authService = AuthService.getInstance()

export async function registerController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { username, password, email, firstname, lastname } = req.body
    const { mnemonic, isValidMnemonic, keyring, pair } = await walletService.createNewWallet()
    const address = pair.address

    if (!mnemonic || !isValidMnemonic) {
      return res.status(400).json({ error: 'Invalid mnemonic' })
    }
    const userRole = await prisma.role.findFirst({
      where: { name: 'User' }
    })
    if (!userRole) {
      return res.status(400).json({ error: 'User role not found' })
    }

    const hashedPassword = await createHashedPassword(password)
    const encryptedMnemonic = cryptoJs.AES.encrypt(mnemonic, config.secrets.secretKey).toString()

    const data = {
      roleId: userRole.id,
      username,
      password: hashedPassword,
      email,
      firstname,
      lastname,
      walletAddress: address,
      walletMnemonic: encryptedMnemonic
    }

    const { account, user } = await authService.createNewUser(data)

    return res.status(200).json({
      message: 'Registration successfully'
    })
  } catch (error) {
    console.error('Error registration:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function loginUsernameController(req: any, res: Response, next: NextFunction): Promise<any> {
  const { username, password }: { username: string; password: string } = req.body
  try {
    const formattedUsername = username.toLowerCase().trim()
    const existingAccount = await prisma.account.findUnique({
      where: { username: formattedUsername }
    })
    if (!existingAccount) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const { token, email, emailIsVerified, name } = await authService.login({
      account: existingAccount,
      password
    })
    req.session.token = token
    return res.status(200).json({
      message: 'Login successful',
      token,
      email,
      emailIsVerified,
      name
    })
  } catch (error) {
    console.error('Error login:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function loginEmailController(req: any, res: Response, next: NextFunction): Promise<any> {
  const { email, password }: { email: string; password: string } = req.body
  try {
    const existingAccount = await prisma.account.findUnique({
      where: { email }
    })
    if (!existingAccount) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const {
      token,
      email: emailAccount,
      emailIsVerified,
      name
    } = await authService.login({
      account: existingAccount,
      password
    })
    req.session.token = token
    return res.status(200).json({
      message: 'Login successful',
      token,
      email: emailAccount,
      emailIsVerified,
      name
    })
  } catch (error) {
    console.error('Error login:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function loginPhoneNumberController(req: any, res: Response, next: NextFunction): Promise<any> {
  const { phoneNumber, password }: { phoneNumber: string; password: string } = req.body
  try {
    const existingAccount = await prisma.account.findUnique({
      where: { phoneNumber }
    })
    if (!existingAccount) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const { token, email, emailIsVerified, name } = await authService.login({
      account: existingAccount,
      password
    })
    req.session.token = token
    return res.status(200).json({
      message: 'Login successful',
      token,
      email,
      emailIsVerified,
      name
    })
  } catch (error) {
    console.error('Error login:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function logoutController(req: Request, res: Response, next: NextFunction) {
  try {
    req.session.destroy((err) => {
      if (err) {
        return next(err)
      }
      return res.status(200).json({ message: 'Logout successful' })
    })
  } catch (error) {
    next(error)
  }
}
