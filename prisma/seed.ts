import { PrismaClient } from '../src/generated/prisma/client'
import WalletService from '../src/services/wallet.service'
import * as dotenv from 'dotenv'
import cryptoJs from 'crypto-js'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const createHashedPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}

const compareHashedPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

const walletService = WalletService.getInstance()

async function main() {
  const SECRET_KEY = process.env.SECRET || ''

  if (!SECRET_KEY) {
    throw new Error('SECRET_KEY is not defined in .env file')
  }

  const roles = await prisma.role.createManyAndReturn({
    data: [{ name: 'Admin' }, { name: 'Staff' }, { name: 'User' }]
  })

  const positions = await prisma.position.createManyAndReturn({
    data: [{ name: 'Doctor' }, { name: 'Nurse' }, { name: 'Receptionist' }]
  })

  const adminWallet = await walletService.createNewWallet()

  const encryptedMnemonic = cryptoJs.AES.encrypt(adminWallet.mnemonic, SECRET_KEY).toString()

  const password = '123123'

  const hashedPassword = await createHashedPassword(password)

  const adminAccount = await prisma.account.create({
    data: {
      roleId: roles[0].id,
      username: 'admin',
      password: hashedPassword,
      email: 'admin@gmail.com',
      emailIsVerified: true,
      firstname: 'Admin',
      lastname: 'Nguyen',
      walletAddress: adminWallet.pair.address,
      walletMnemonic: encryptedMnemonic
    }
  })

  console.log('Admin account created:', adminAccount)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
