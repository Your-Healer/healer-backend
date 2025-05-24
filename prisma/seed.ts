import { PrismaClient, EDUCATIONLEVEL } from '../src/generated/prisma/client'
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

  console.log('Starting database seeding...')

  // ================ ROLES ================
  console.log('Creating roles...')
  const adminRole = await prisma.role.upsert({
    where: { id: '1' },
    update: {},
    create: { id: '1', name: 'Admin', description: 'System administrator' }
  })

  const staffRole = await prisma.role.upsert({
    where: { id: '2' },
    update: {},
    create: { id: '2', name: 'Staff', description: 'Medical staff' }
  })

  const userRole = await prisma.role.upsert({
    where: { id: '3' },
    update: {},
    create: { id: '3', name: 'User', description: 'Regular user/patient' }
  })

  // ================ POSITIONS ================
  console.log('Creating positions...')
  const doctorPosition = await prisma.position.upsert({
    where: { id: '1' },
    update: {},
    create: { id: '1', name: 'Doctor' }
  })

  const nursePosition = await prisma.position.upsert({
    where: { id: '2' },
    update: {},
    create: { id: '2', name: 'Nurse' }
  })

  const receptionistPosition = await prisma.position.upsert({
    where: { id: '3' },
    update: {},
    create: { id: '3', name: 'Receptionist' }
  })

  // ================ ATTACHMENTS ================
  console.log('Creating attachments...')
  const avatar = await prisma.attachment.create({
    data: {
      fileName: 'avatar.png',
      directory: '/avatars/',
      length: BigInt(12345),
      mediaType: 'image/png'
    }
  })

  // ================ LOCATION ================
  console.log('Creating locations...')
  const mainLocation = await prisma.location.create({
    data: {
      name: 'Main Hospital',
      detail: 'Main hospital building',
      street: '123 Medical Avenue',
      city: 'Health City',
      country: 'Vietnam',
      lat: 10.8231,
      lng: 106.6297
    }
  })

  // ================ DEPARTMENTS ================
  console.log('Creating departments...')
  const cardiologyDept = await prisma.department.create({
    data: {
      locationId: mainLocation.id,
      name: 'Cardiology',
      symbol: 'CARD',
      floor: 2
    }
  })

  const neurologyDept = await prisma.department.create({
    data: {
      locationId: mainLocation.id,
      name: 'Neurology',
      symbol: 'NEUR',
      floor: 3
    }
  })

  const generalDept = await prisma.department.create({
    data: {
      locationId: mainLocation.id,
      name: 'General',
      symbol: 'GEN',
      floor: 1
    }
  })

  // ================ SERVICES ================
  console.log('Creating services...')
  const consultationService = await prisma.service.create({
    data: {
      name: 'Consultation'
    }
  })

  const ecgService = await prisma.service.create({
    data: {
      name: 'ECG'
    }
  })

  const mriService = await prisma.service.create({
    data: {
      name: 'MRI Scan'
    }
  })

  // ================ MEDICAL ROOMS ================
  console.log('Creating medical rooms...')
  const cardRoom1 = await prisma.medicalRoom.create({
    data: {
      departmentId: cardiologyDept.id,
      serviceId: consultationService.id,
      floor: 2,
      name: 'Cardiology Consultation Room 1'
    }
  })

  const cardRoom2 = await prisma.medicalRoom.create({
    data: {
      departmentId: cardiologyDept.id,
      serviceId: ecgService.id,
      floor: 2,
      name: 'ECG Room'
    }
  })

  const neuroRoom = await prisma.medicalRoom.create({
    data: {
      departmentId: neurologyDept.id,
      serviceId: consultationService.id,
      floor: 3,
      name: 'Neurology Consultation Room'
    }
  })

  const mriRoom = await prisma.medicalRoom.create({
    data: {
      departmentId: neurologyDept.id,
      serviceId: mriService.id,
      floor: 3,
      name: 'MRI Scanning Room'
    }
  })

  const generalRoom = await prisma.medicalRoom.create({
    data: {
      departmentId: generalDept.id,
      serviceId: consultationService.id,
      floor: 1,
      name: 'General Checkup Room'
    }
  })

  // ================ ADMIN ACCOUNT ================
  console.log('Creating admin account...')
  const adminWallet = await walletService.createNewWallet()
  const adminEncryptedMnemonic = cryptoJs.AES.encrypt(adminWallet.mnemonic, SECRET_KEY).toString()
  const adminHashedPassword = await createHashedPassword('admin123')

  const adminAccount = await prisma.account.create({
    data: {
      roleId: adminRole.id,
      avatarId: avatar.id,
      username: 'admin',
      password: adminHashedPassword,
      email: 'admin@healer.com',
      firstname: 'Admin',
      lastname: 'User',
      walletAddress: adminWallet.pair.address,
      walletMnemonic: adminEncryptedMnemonic,
      emailIsVerified: true
    }
  })

  await prisma.user.create({
    data: {
      accountId: adminAccount.id,
      firstname: 'Admin',
      lastname: 'User',
      phoneNumber: '0909123456',
      address: '123 Admin Street'
    }
  })

  // ================ DOCTOR ACCOUNTS ================
  console.log('Creating doctor accounts...')
  // Cardiologist
  const cardioWallet = await walletService.createNewWallet()
  const cardioEncryptedMnemonic = cryptoJs.AES.encrypt(cardioWallet.mnemonic, SECRET_KEY).toString()
  const cardioHashedPassword = await createHashedPassword('doctor123')

  const cardioAccount = await prisma.account.create({
    data: {
      roleId: staffRole.id,
      username: 'cardiologist',
      password: cardioHashedPassword,
      email: 'cardio@healer.com',
      firstname: 'John',
      lastname: 'Heart',
      walletAddress: cardioWallet.pair.address,
      walletMnemonic: cardioEncryptedMnemonic,
      emailIsVerified: true
    }
  })

  const cardioStaff = await prisma.staff.create({
    data: {
      accountId: cardioAccount.id,
      firstname: 'John',
      lastname: 'Heart',
      introduction: 'Experienced cardiologist with 15 years of practice',
      educationLevel: EDUCATIONLEVEL.PROFESSIONAL
    }
  })

  await prisma.positionStaff.create({
    data: {
      positionId: doctorPosition.id,
      staffId: cardioStaff.id
    }
  })

  await prisma.staffOnDepartment.create({
    data: {
      staffId: cardioStaff.id,
      departmentId: cardiologyDept.id
    }
  })

  // Neurologist
  const neuroWallet = await walletService.createNewWallet()
  const neuroEncryptedMnemonic = cryptoJs.AES.encrypt(neuroWallet.mnemonic, SECRET_KEY).toString()
  const neuroHashedPassword = await createHashedPassword('doctor123')

  const neuroAccount = await prisma.account.create({
    data: {
      roleId: staffRole.id,
      username: 'neurologist',
      password: neuroHashedPassword,
      email: 'neuro@healer.com',
      firstname: 'Sarah',
      lastname: 'Brain',
      walletAddress: neuroWallet.pair.address,
      walletMnemonic: neuroEncryptedMnemonic,
      emailIsVerified: true
    }
  })

  const neuroStaff = await prisma.staff.create({
    data: {
      accountId: neuroAccount.id,
      firstname: 'Sarah',
      lastname: 'Brain',
      introduction: 'Specialist in neurological disorders',
      educationLevel: EDUCATIONLEVEL.PROFESSIONAL
    }
  })

  await prisma.positionStaff.create({
    data: {
      positionId: doctorPosition.id,
      staffId: neuroStaff.id
    }
  })

  await prisma.staffOnDepartment.create({
    data: {
      staffId: neuroStaff.id,
      departmentId: neurologyDept.id
    }
  })

  // General practitioner
  const generalWallet = await walletService.createNewWallet()
  const generalEncryptedMnemonic = cryptoJs.AES.encrypt(generalWallet.mnemonic, SECRET_KEY).toString()
  const generalHashedPassword = await createHashedPassword('doctor123')

  const generalAccount = await prisma.account.create({
    data: {
      roleId: staffRole.id,
      username: 'generaldoc',
      password: generalHashedPassword,
      email: 'general@healer.com',
      firstname: 'Michael',
      lastname: 'Health',
      walletAddress: generalWallet.pair.address,
      walletMnemonic: generalEncryptedMnemonic,
      emailIsVerified: true
    }
  })

  const generalStaff = await prisma.staff.create({
    data: {
      accountId: generalAccount.id,
      firstname: 'Michael',
      lastname: 'Health',
      introduction: 'General practitioner with focus on preventive care',
      educationLevel: EDUCATIONLEVEL.MASTER
    }
  })

  await prisma.positionStaff.create({
    data: {
      positionId: doctorPosition.id,
      staffId: generalStaff.id
    }
  })

  await prisma.staffOnDepartment.create({
    data: {
      staffId: generalStaff.id,
      departmentId: generalDept.id
    }
  })

  // ================ NURSE ACCOUNT ================
  console.log('Creating nurse account...')
  const nurseWallet = await walletService.createNewWallet()
  const nurseEncryptedMnemonic = cryptoJs.AES.encrypt(nurseWallet.mnemonic, SECRET_KEY).toString()
  const nurseHashedPassword = await createHashedPassword('nurse123')

  const nurseAccount = await prisma.account.create({
    data: {
      roleId: staffRole.id,
      username: 'nurse',
      password: nurseHashedPassword,
      email: 'nurse@healer.com',
      firstname: 'Emily',
      lastname: 'Care',
      walletAddress: nurseWallet.pair.address,
      walletMnemonic: nurseEncryptedMnemonic,
      emailIsVerified: true
    }
  })

  const nurseStaff = await prisma.staff.create({
    data: {
      accountId: nurseAccount.id,
      firstname: 'Emily',
      lastname: 'Care',
      introduction: 'Experienced nurse specializing in patient care',
      educationLevel: EDUCATIONLEVEL.BACHELOR
    }
  })

  await prisma.positionStaff.create({
    data: {
      positionId: nursePosition.id,
      staffId: nurseStaff.id
    }
  })

  await prisma.staffOnDepartment.create({
    data: {
      staffId: nurseStaff.id,
      departmentId: generalDept.id
    }
  })

  // ================ PATIENT ACCOUNTS ================
  console.log('Creating patient accounts...')
  // Patient 1
  const patient1Wallet = await walletService.createNewWallet()
  const patient1EncryptedMnemonic = cryptoJs.AES.encrypt(patient1Wallet.mnemonic, SECRET_KEY).toString()
  const patient1HashedPassword = await createHashedPassword('patient123')

  const patient1Account = await prisma.account.create({
    data: {
      roleId: userRole.id,
      username: 'patient1',
      password: patient1HashedPassword,
      email: 'patient1@example.com',
      firstname: 'Jane',
      lastname: 'Doe',
      walletAddress: patient1Wallet.pair.address,
      walletMnemonic: patient1EncryptedMnemonic,
      emailIsVerified: true,
      phoneNumber: '0901234567'
    }
  })

  await prisma.user.create({
    data: {
      accountId: patient1Account.id,
      firstname: 'Jane',
      lastname: 'Doe',
      phoneNumber: '0901234567',
      address: '456 Patient Street, District 1'
    }
  })

  // Patient 2
  const patient2Wallet = await walletService.createNewWallet()
  const patient2EncryptedMnemonic = cryptoJs.AES.encrypt(patient2Wallet.mnemonic, SECRET_KEY).toString()
  const patient2HashedPassword = await createHashedPassword('patient123')

  const patient2Account = await prisma.account.create({
    data: {
      roleId: userRole.id,
      username: 'patient2',
      password: patient2HashedPassword,
      email: 'patient2@example.com',
      firstname: 'Bob',
      lastname: 'Smith',
      walletAddress: patient2Wallet.pair.address,
      walletMnemonic: patient2EncryptedMnemonic,
      emailIsVerified: true,
      phoneNumber: '0907654321'
    }
  })

  await prisma.user.create({
    data: {
      accountId: patient2Account.id,
      firstname: 'Bob',
      lastname: 'Smith',
      phoneNumber: '0907654321',
      address: '789 Patient Avenue, District 2'
    }
  })

  // ================ MEDICAL ROOM TIMES ================
  console.log('Creating medical room times...')
  // Create time slots for the next 7 days
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(today)
    currentDate.setDate(currentDate.getDate() + day)

    // Morning slots for each room
    for (let hour = 8; hour < 12; hour++) {
      const fromTime = new Date(currentDate)
      fromTime.setHours(hour, 0, 0, 0)

      const toTime = new Date(fromTime)
      toTime.setMinutes(45) // 45-minute slots

      // Cardiology consultation room
      await prisma.medicalRoomTime.create({
        data: {
          roomId: cardRoom1.id,
          fromTime,
          toTime
        }
      })

      // Neurology consultation room
      await prisma.medicalRoomTime.create({
        data: {
          roomId: neuroRoom.id,
          fromTime,
          toTime
        }
      })

      // General checkup room
      await prisma.medicalRoomTime.create({
        data: {
          roomId: generalRoom.id,
          fromTime,
          toTime
        }
      })
    }

    // Afternoon slots
    for (let hour = 13; hour < 17; hour++) {
      const fromTime = new Date(currentDate)
      fromTime.setHours(hour, 0, 0, 0)

      const toTime = new Date(fromTime)
      toTime.setMinutes(45)

      // Cardiology consultation room
      await prisma.medicalRoomTime.create({
        data: {
          roomId: cardRoom1.id,
          fromTime,
          toTime
        }
      })

      // Neurology consultation room
      await prisma.medicalRoomTime.create({
        data: {
          roomId: neuroRoom.id,
          fromTime,
          toTime
        }
      })

      // General checkup room
      await prisma.medicalRoomTime.create({
        data: {
          roomId: generalRoom.id,
          fromTime,
          toTime
        }
      })

      // ECG room (afternoons only)
      if (hour >= 14 && hour < 16) {
        await prisma.medicalRoomTime.create({
          data: {
            roomId: cardRoom2.id,
            fromTime,
            toTime
          }
        })
      }

      // MRI room (afternoons only, longer slots)
      if (hour === 13 || hour === 15) {
        const mriFromTime = new Date(currentDate)
        mriFromTime.setHours(hour, 0, 0, 0)

        const mriToTime = new Date(mriFromTime)
        mriToTime.setMinutes(90) // 90-minute slots for MRI

        await prisma.medicalRoomTime.create({
          data: {
            roomId: mriRoom.id,
            fromTime: mriFromTime,
            toTime: mriToTime
          }
        })
      }
    }
  }

  // ================ SHIFT WORKING ================
  console.log('Creating staff shifts...')
  // Create shifts for doctors for the next 7 days
  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(today)
    currentDate.setDate(currentDate.getDate() + day)

    // Skip weekends for some doctors
    const dayOfWeek = currentDate.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    if (!isWeekend || dayOfWeek === 6) {
      // Saturday shifts for cardio
      // Cardiologist morning shift
      const cardioMorningStart = new Date(currentDate)
      cardioMorningStart.setHours(8, 0, 0, 0)

      const cardioMorningEnd = new Date(currentDate)
      cardioMorningEnd.setHours(12, 0, 0, 0)

      await prisma.shiftWorking.create({
        data: {
          doctorId: cardioStaff.id,
          roomId: cardRoom1.id,
          fromTime: cardioMorningStart,
          toTime: cardioMorningEnd
        }
      })

      // Cardiologist afternoon ECG shift
      const cardioAfternoonStart = new Date(currentDate)
      cardioAfternoonStart.setHours(14, 0, 0, 0)

      const cardioAfternoonEnd = new Date(currentDate)
      cardioAfternoonEnd.setHours(16, 0, 0, 0)

      await prisma.shiftWorking.create({
        data: {
          doctorId: cardioStaff.id,
          roomId: cardRoom2.id,
          fromTime: cardioAfternoonStart,
          toTime: cardioAfternoonEnd
        }
      })
    }

    if (!isWeekend || dayOfWeek === 0) {
      // Sunday shifts for neuro
      // Neurologist shifts
      const neuroStart = new Date(currentDate)
      neuroStart.setHours(9, 0, 0, 0)

      const neuroEnd = new Date(currentDate)
      neuroEnd.setHours(15, 0, 0, 0)

      await prisma.shiftWorking.create({
        data: {
          doctorId: neuroStaff.id,
          roomId: neuroRoom.id,
          fromTime: neuroStart,
          toTime: neuroEnd
        }
      })
    }

    if (!isWeekend) {
      // Weekday shifts for general doc
      // General doctor morning shift
      const generalMorningStart = new Date(currentDate)
      generalMorningStart.setHours(8, 0, 0, 0)

      const generalMorningEnd = new Date(currentDate)
      generalMorningEnd.setHours(12, 0, 0, 0)

      await prisma.shiftWorking.create({
        data: {
          doctorId: generalStaff.id,
          roomId: generalRoom.id,
          fromTime: generalMorningStart,
          toTime: generalMorningEnd
        }
      })

      // General doctor afternoon shift
      const generalAfternoonStart = new Date(currentDate)
      generalAfternoonStart.setHours(13, 0, 0, 0)

      const generalAfternoonEnd = new Date(currentDate)
      generalAfternoonEnd.setHours(17, 0, 0, 0)

      await prisma.shiftWorking.create({
        data: {
          doctorId: generalStaff.id,
          roomId: generalRoom.id,
          fromTime: generalAfternoonStart,
          toTime: generalAfternoonEnd
        }
      })
    }
  }

  console.log('Database seeding completed!')
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error('Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
