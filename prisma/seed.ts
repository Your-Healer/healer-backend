import { PrismaClient } from '../src/generated/prisma/client'
import WalletService from '../src/services/wallet.service'
import * as dotenv from 'dotenv'
import cryptoJs from 'crypto-js'
import bcrypt from 'bcrypt'

dotenv.config()

const prisma = new PrismaClient()

const createHashedPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}

async function main() {
  const SECRET_KEY = process.env.SECRET || ''
  if (!SECRET_KEY) throw new Error('SECRET_KEY is not defined in .env file')

  const walletService = WalletService.getInstance()

  const roles = await prisma.role.createMany({
    data: [{ name: 'Admin' }, { name: 'Staff' }, { name: 'User' }],
    skipDuplicates: true
  })

  const positions = await prisma.position.createMany({
    data: [{ name: 'Doctor' }, { name: 'Nurse' }, { name: 'Receptionist' }],
    skipDuplicates: true
  })

  const avatar = await prisma.attachment.create({
    data: {
      fileName: 'avatar.png',
      directory: '/avatars/',
      length: 12345,
      mediaType: 'image/png'
    }
  })

  const adminWallet = await walletService.createNewWallet()
  const encryptedMnemonic = cryptoJs.AES.encrypt(adminWallet.mnemonic, SECRET_KEY).toString()
  const hashedPassword = await createHashedPassword('123123')

  const adminAccount = await prisma.account.create({
    data: {
      role: { connect: { name: 'Admin' } },
      username: 'admin',
      password: hashedPassword,
      email: 'admin@gmail.com',
      firstname: 'Admin',
      lastname: 'Nguyen',
      walletAddress: adminWallet.pair.address,
      avatarId: avatar.id
    }
  })

  await prisma.user.create({
    data: {
      accountId: adminAccount.id,
      firstname: 'Admin',
      lastname: 'Nguyen',
      phoneNumber: '0123456789',
      address: '123 Admin Street'
    }
  })

  console.log('Admin account and user profile created.')
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
