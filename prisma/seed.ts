import { PrismaClient, EDUCATIONLEVEL, APPOINTMENTSTATUS, User, Patient, MedicalRoomTime } from '@prisma/client'
import BlockchainService from '../src/services/blockchain.service'
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
  const SECRET_KEY = process.env.SECRET || 'default-secret-key'
  if (!SECRET_KEY) throw new Error('SECRET_KEY is not defined in .env file')

  const blockchainService = BlockchainService.getInstance()

  console.log('Bắt đầu khởi tạo dữ liệu mẫu...')

  // ================ XÓA DỮ LIỆU CŨ (nếu có) ================
  console.log('Xóa dữ liệu cũ...')
  await prisma.appointmentStatusLog.deleteMany()
  await prisma.diagnosisSuggestion.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.bookingTime.deleteMany()
  await prisma.shiftWorking.deleteMany()
  await prisma.medicalRoomTime.deleteMany()
  await prisma.medicalRoom.deleteMany()
  await prisma.staffOnDepartment.deleteMany()
  await prisma.positionStaff.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.user.deleteMany()
  await prisma.account.deleteMany()
  await prisma.service.deleteMany()
  await prisma.department.deleteMany()
  await prisma.location.deleteMany()
  await prisma.position.deleteMany()
  await prisma.role.deleteMany()
  await prisma.attachment.deleteMany()

  // ================ TẠO VAI TRÒ (3 roles) ================
  console.log('Tạo các vai trò...')
  const adminRole = await prisma.role.create({
    data: {
      id: '1',
      name: 'Quản trị viên',
      description: 'Quản trị hệ thống toàn bộ bệnh viện, phân công lịch trực cho tất cả nhân viên'
    }
  })

  const staffRole = await prisma.role.create({
    data: {
      id: '2',
      name: 'Nhân viên',
      description: 'Nhân viên y tế làm việc tại bệnh viện'
    }
  })

  const userRole = await prisma.role.create({
    data: {
      id: '3',
      name: 'Người dùng',
      description: 'Bệnh nhân và người dùng hệ thống'
    }
  })

  // ================ TẠO CHỨC VỤ (4 positions) ================
  console.log('Tạo các chức vụ...')
  const doctorPosition = await prisma.position.create({
    data: { id: '1', name: 'Bác sĩ' }
  })

  const nursePosition = await prisma.position.create({
    data: { id: '2', name: 'Y tá' }
  })

  const receptionistPosition = await prisma.position.create({
    data: { id: '3', name: 'Lễ tân' }
  })

  const departmentHeadPosition = await prisma.position.create({
    data: { id: '4', name: 'Trưởng khoa' }
  })

  // ================ BỎ QUA ATTACHMENT (tùy chọn) ================
  console.log('Bỏ qua tạo attachment - avatar sẽ để trống...')

  // ================ TẠO ĐỊA ĐIỂM ================
  console.log('Tạo các địa điểm...')
  const mainLocation = await prisma.location.create({
    data: {
      name: 'Bệnh viện Đa khoa Hà Nội',
      detail: 'Tòa nhà chính của bệnh viện',
      street: '123 Đường Láng',
      city: 'Hà Nội',
      country: 'Việt Nam',
      lat: 21.0285,
      lng: 105.8542
    }
  })

  const branchLocation = await prisma.location.create({
    data: {
      name: 'Bệnh viện Chi nhánh Cầu Giấy',
      detail: 'Chi nhánh tại quận Cầu Giấy',
      street: '456 Phố Duy Tân',
      city: 'Hà Nội',
      country: 'Việt Nam',
      lat: 21.0313,
      lng: 105.7971
    }
  })

  const emergencyLocation = await prisma.location.create({
    data: {
      name: 'Trung tâm Cấp cứu 24/7',
      detail: 'Trung tâm cấp cứu hoạt động 24/7',
      street: '789 Đường Giải Phóng',
      city: 'Hà Nội',
      country: 'Việt Nam',
      lat: 21.0122,
      lng: 105.8515
    }
  })

  // ================ TẠO KHOA MỚI ================
  console.log('Tạo các khoa...')
  const dentistryDept = await prisma.department.create({
    data: {
      locationId: mainLocation.id,
      name: 'Khoa Răng Hàm Mặt',
      symbol: 'RHM',
      floor: 1
    }
  })

  const cardiologyDept = await prisma.department.create({
    data: {
      locationId: mainLocation.id,
      name: 'Khoa Tim Mạch',
      symbol: 'TIM',
      floor: 2
    }
  })

  const pulmonologyDept = await prisma.department.create({
    data: {
      locationId: mainLocation.id,
      name: 'Khoa Hô Hấp',
      symbol: 'HH',
      floor: 3
    }
  })

  const generalDept = await prisma.department.create({
    data: {
      locationId: mainLocation.id,
      name: 'Khoa Đa Khoa',
      symbol: 'DK',
      floor: 4
    }
  })

  const neurologyDept = await prisma.department.create({
    data: {
      locationId: branchLocation.id,
      name: 'Khoa Thần Kinh',
      symbol: 'TK',
      floor: 1
    }
  })

  const gastroenterologyDept = await prisma.department.create({
    data: {
      locationId: branchLocation.id,
      name: 'Khoa Tiêu Hóa',
      symbol: 'TH',
      floor: 2
    }
  })

  const vaccinationDept = await prisma.department.create({
    data: {
      locationId: emergencyLocation.id,
      name: 'Khoa Tiêm Chủng',
      symbol: 'TC',
      floor: 1
    }
  })

  // ================ TẠO DỊCH VỤ MỚI ================
  console.log('Tạo các dịch vụ...')
  const insuranceExamService = await prisma.service.create({
    data: {
      name: 'Khám Bảo Hiểm',
      description: 'Dịch vụ khám chữa bệnh theo bảo hiểm y tế',
      durationTime: 20
    }
  })

  const paidExamService = await prisma.service.create({
    data: {
      name: 'Khám Dịch Vụ',
      description: 'Dịch vụ khám chữa bệnh tự nguyện, không qua bảo hiểm',
      durationTime: 30
    }
  })

  const vaccinationService = await prisma.service.create({
    data: {
      name: 'Tiêm Vắc Xin',
      description: 'Dịch vụ tiêm phòng các loại vắc xin',
      durationTime: 15
    }
  })

  // ================ TẠO PHÒNG KHÁM MỚI ================
  console.log('Tạo các phòng khám...')
  const rooms = await Promise.all([
    // Khoa Răng Hàm Mặt
    prisma.medicalRoom.create({
      data: {
        departmentId: dentistryDept.id,
        serviceId: insuranceExamService.id,
        floor: 1,
        name: 'Phòng khám RHM - Bảo hiểm 101'
      }
    }),
    prisma.medicalRoom.create({
      data: {
        departmentId: dentistryDept.id,
        serviceId: paidExamService.id,
        floor: 1,
        name: 'Phòng khám RHM - Dịch vụ 102'
      }
    }),

    // Khoa Tim Mạch
    prisma.medicalRoom.create({
      data: {
        departmentId: cardiologyDept.id,
        serviceId: insuranceExamService.id,
        floor: 2,
        name: 'Phòng khám Tim Mạch - Bảo hiểm 201'
      }
    }),
    prisma.medicalRoom.create({
      data: {
        departmentId: cardiologyDept.id,
        serviceId: paidExamService.id,
        floor: 2,
        name: 'Phòng khám Tim Mạch - Dịch vụ 202'
      }
    }),

    // Khoa Hô Hấp
    prisma.medicalRoom.create({
      data: {
        departmentId: pulmonologyDept.id,
        serviceId: insuranceExamService.id,
        floor: 3,
        name: 'Phòng khám Hô Hấp - Bảo hiểm 301'
      }
    }),
    prisma.medicalRoom.create({
      data: {
        departmentId: pulmonologyDept.id,
        serviceId: paidExamService.id,
        floor: 3,
        name: 'Phòng khám Hô Hấp - Dịch vụ 302'
      }
    }),

    // Khoa Đa Khoa
    prisma.medicalRoom.create({
      data: {
        departmentId: generalDept.id,
        serviceId: insuranceExamService.id,
        floor: 4,
        name: 'Phòng khám Đa Khoa - Bảo hiểm 401'
      }
    }),
    prisma.medicalRoom.create({
      data: {
        departmentId: generalDept.id,
        serviceId: paidExamService.id,
        floor: 4,
        name: 'Phòng khám Đa Khoa - Dịch vụ 402'
      }
    }),

    // Khoa Thần Kinh
    prisma.medicalRoom.create({
      data: {
        departmentId: neurologyDept.id,
        serviceId: insuranceExamService.id,
        floor: 1,
        name: 'Phòng khám Thần Kinh - Bảo hiểm 101'
      }
    }),
    prisma.medicalRoom.create({
      data: {
        departmentId: neurologyDept.id,
        serviceId: paidExamService.id,
        floor: 1,
        name: 'Phòng khám Thần Kinh - Dịch vụ 102'
      }
    }),

    // Khoa Tiêu Hóa
    prisma.medicalRoom.create({
      data: {
        departmentId: gastroenterologyDept.id,
        serviceId: insuranceExamService.id,
        floor: 2,
        name: 'Phòng khám Tiêu Hóa - Bảo hiểm 201'
      }
    }),
    prisma.medicalRoom.create({
      data: {
        departmentId: gastroenterologyDept.id,
        serviceId: paidExamService.id,
        floor: 2,
        name: 'Phòng khám Tiêu Hóa - Dịch vụ 202'
      }
    }),

    // Khoa Tiêm Chủng
    prisma.medicalRoom.create({
      data: {
        departmentId: vaccinationDept.id,
        serviceId: vaccinationService.id,
        floor: 1,
        name: 'Phòng tiêm chủng trẻ em 101'
      }
    }),
    prisma.medicalRoom.create({
      data: {
        departmentId: vaccinationDept.id,
        serviceId: vaccinationService.id,
        floor: 1,
        name: 'Phòng tiêm chủng người lớn 102'
      }
    })
  ])

  // ================ TẠO BÁC SĨ CHO CÁC KHOA MỚI ================
  console.log('Tạo bác sĩ cho các khoa...')

  // Bác sĩ Răng Hàm Mặt
  const dentistWallet = await blockchainService.createNewWallet()
  const dentistEncryptedMnemonic = cryptoJs.AES.encrypt(dentistWallet.mnemonic, SECRET_KEY).toString()
  const dentistHashedPassword = await createHashedPassword('doctor123')

  const dentistAccount = await prisma.account.create({
    data: {
      roleId: staffRole.id,
      username: 'bs.duc.rhm', // Đổi username
      password: dentistHashedPassword,
      email: 'bsducrhm@benhvien.vn', // Đổi email
      phoneNumber: '0902111111',
      walletAddress: dentistWallet.pair.address,
      walletMnemonic: dentistEncryptedMnemonic,
      emailIsVerified: true
    }
  })

  const dentistStaff = await prisma.staff.create({
    data: {
      accountId: dentistAccount.id,
      firstname: 'Nguyễn',
      lastname: 'Văn Đức',
      introduction: 'Bác sĩ chuyên khoa Răng Hàm Mặt với 10 năm kinh nghiệm.',
      educationLevel: EDUCATIONLEVEL.PROFESSIONAL
    }
  })

  await Promise.all([
    prisma.positionStaff.create({
      data: { positionId: doctorPosition.id, staffId: dentistStaff.id }
    }),
    prisma.staffOnDepartment.create({
      data: { staffId: dentistStaff.id, departmentId: dentistryDept.id }
    })
  ])

  // Bác sĩ Hô Hấp
  const pulmonologistWallet = await blockchainService.createNewWallet()
  const pulmonologistEncryptedMnemonic = cryptoJs.AES.encrypt(pulmonologistWallet.mnemonic, SECRET_KEY).toString()
  const pulmonologistHashedPassword = await createHashedPassword('doctor123')

  const pulmonologistAccount = await prisma.account.create({
    data: {
      roleId: staffRole.id,
      username: 'bs.linh',
      password: pulmonologistHashedPassword,
      email: 'bslinh@benhvien.vn',
      phoneNumber: '0902222222',
      walletAddress: pulmonologistWallet.pair.address,
      walletMnemonic: pulmonologistEncryptedMnemonic,
      emailIsVerified: true
    }
  })

  const pulmonologistStaff = await prisma.staff.create({
    data: {
      accountId: pulmonologistAccount.id,
      firstname: 'Trần',
      lastname: 'Thị Linh',
      introduction: 'Bác sĩ chuyên khoa Hô Hấp, chuyên điều trị các bệnh lý phổi.',
      educationLevel: EDUCATIONLEVEL.PROFESSIONAL
    }
  })

  await Promise.all([
    prisma.positionStaff.create({
      data: { positionId: doctorPosition.id, staffId: pulmonologistStaff.id }
    }),
    prisma.staffOnDepartment.create({
      data: { staffId: pulmonologistStaff.id, departmentId: pulmonologyDept.id }
    })
  ])

  // Bác sĩ Tiêu Hóa
  const gastroenterologistWallet = await blockchainService.createNewWallet()
  const gastroenterologistEncryptedMnemonic = cryptoJs.AES.encrypt(
    gastroenterologistWallet.mnemonic,
    SECRET_KEY
  ).toString()
  const gastroenterologistHashedPassword = await createHashedPassword('doctor123')

  const gastroenterologistAccount = await prisma.account.create({
    data: {
      roleId: staffRole.id,
      username: 'bs.nam',
      password: gastroenterologistHashedPassword,
      email: 'bsnam@benhvien.vn',
      phoneNumber: '0902333333',
      walletAddress: gastroenterologistWallet.pair.address,
      walletMnemonic: gastroenterologistEncryptedMnemonic,
      emailIsVerified: true
    }
  })

  const gastroenterologistStaff = await prisma.staff.create({
    data: {
      accountId: gastroenterologistAccount.id,
      firstname: 'Lê',
      lastname: 'Văn Nam',
      introduction: 'Bác sĩ chuyên khoa Tiêu Hóa, chuyên điều trị các bệnh lý dạ dày ruột.',
      educationLevel: EDUCATIONLEVEL.PROFESSIONAL
    }
  })

  await Promise.all([
    prisma.positionStaff.create({
      data: { positionId: doctorPosition.id, staffId: gastroenterologistStaff.id }
    }),
    prisma.staffOnDepartment.create({
      data: { staffId: gastroenterologistStaff.id, departmentId: gastroenterologyDept.id }
    })
  ])

  // Y tá Tiêm Chủng
  const vaccinationNurseWallet = await blockchainService.createNewWallet()
  const vaccinationNurseEncryptedMnemonic = cryptoJs.AES.encrypt(vaccinationNurseWallet.mnemonic, SECRET_KEY).toString()
  const vaccinationNurseHashedPassword = await createHashedPassword('nurse123')

  const vaccinationNurseAccount = await prisma.account.create({
    data: {
      roleId: staffRole.id,
      username: 'yta.hoa',
      password: vaccinationNurseHashedPassword,
      email: 'ytahoa@benhvien.vn',
      phoneNumber: '0907111111',
      walletAddress: vaccinationNurseWallet.pair.address,
      walletMnemonic: vaccinationNurseEncryptedMnemonic,
      emailIsVerified: true
    }
  })

  const vaccinationNurseStaff = await prisma.staff.create({
    data: {
      accountId: vaccinationNurseAccount.id,
      firstname: 'Phạm',
      lastname: 'Thị Hoa',
      introduction: 'Y tá chuyên khoa Tiêm Chủng, có kinh nghiệm tiêm phòng cho trẻ em và người lớn.',
      educationLevel: EDUCATIONLEVEL.BACHELOR
    }
  })

  await Promise.all([
    prisma.positionStaff.create({
      data: { positionId: nursePosition.id, staffId: vaccinationNurseStaff.id }
    }),
    prisma.staffOnDepartment.create({
      data: { staffId: vaccinationNurseStaff.id, departmentId: vaccinationDept.id }
    })
  ])

  // ================ TẠO TÀI KHOẢN QUẢN TRỊ ================
  console.log('Tạo tài khoản quản trị viên (có quyền phân công lịch trực toàn bộ)...')
  const adminWallet = await blockchainService.createNewWallet()
  const adminEncryptedMnemonic = cryptoJs.AES.encrypt(adminWallet.mnemonic, SECRET_KEY).toString()
  const adminHashedPassword = await createHashedPassword('admin123')

  const adminAccount = await prisma.account.create({
    data: {
      roleId: adminRole.id,
      username: 'admin',
      password: adminHashedPassword,
      email: 'admin@benhvien.vn',
      phoneNumber: '0901234567',
      walletAddress: adminWallet.pair.address,
      walletMnemonic: adminEncryptedMnemonic,
      emailIsVerified: true
    }
  })

  await prisma.user.create({
    data: {
      accountId: adminAccount.id,
      firstname: 'Nguyễn',
      lastname: 'Quản Trị',
      phoneNumber: '0901234567',
      address: '123 Đường Láng, Đống Đa, Hà Nội'
    }
  })

  // ================ TẠO TÀI KHOẢN TRƯỞNG KHOA ================
  console.log('Tạo tài khoản trưởng khoa Tim mạch...')
  const deptHeadWallet = await blockchainService.createNewWallet()
  const deptHeadEncryptedMnemonic = cryptoJs.AES.encrypt(deptHeadWallet.mnemonic, SECRET_KEY).toString()
  const deptHeadHashedPassword = await createHashedPassword('truongkhoa123')

  const deptHeadAccount = await prisma.account.create({
    data: {
      roleId: staffRole.id, // Vai trò Nhân viên
      username: 'tk.tinh',
      password: deptHeadHashedPassword,
      email: 'truongkhoa@benhvien.vn',
      phoneNumber: '0902345111',
      walletAddress: deptHeadWallet.pair.address,
      walletMnemonic: deptHeadEncryptedMnemonic,
      emailIsVerified: true
    }
  })

  const deptHeadStaff = await prisma.staff.create({
    data: {
      accountId: deptHeadAccount.id,
      firstname: 'Trần',
      lastname: 'Văn Tình',
      introduction: 'Trưởng khoa Tim mạch, có 25 năm kinh nghiệm. Phụ trách phân công lịch trực khoa Tim mạch.',
      educationLevel: EDUCATIONLEVEL.PROFESSIONAL
    }
  })

  await Promise.all([
    // Trưởng khoa vừa là Bác sĩ vừa là Trưởng khoa
    prisma.positionStaff.create({
      data: { positionId: doctorPosition.id, staffId: deptHeadStaff.id }
    }),
    prisma.positionStaff.create({
      data: { positionId: departmentHeadPosition.id, staffId: deptHeadStaff.id }
    }),
    prisma.staffOnDepartment.create({
      data: { staffId: deptHeadStaff.id, departmentId: cardiologyDept.id }
    })
  ])

  // ================ TẠO TÀI KHOẢN BÁC SĨ ================
  console.log('Tạo tài khoản bác sĩ...')

  // Bác sĩ Tim mạch
  const cardioWallet = await blockchainService.createNewWallet()
  const cardioEncryptedMnemonic = cryptoJs.AES.encrypt(cardioWallet.mnemonic, SECRET_KEY).toString()
  const cardioHashedPassword = await createHashedPassword('doctor123')

  const cardioAccount = await prisma.account.create({
    data: {
      roleId: staffRole.id, // Vai trò Nhân viên
      username: 'bs.minh',
      password: cardioHashedPassword,
      email: 'bsminh@benhvien.vn',
      phoneNumber: '0902345678',
      walletAddress: cardioWallet.pair.address,
      walletMnemonic: cardioEncryptedMnemonic,
      emailIsVerified: true
    }
  })

  const cardioStaff = await prisma.staff.create({
    data: {
      accountId: cardioAccount.id,
      firstname: 'Lê',
      lastname: 'Văn Minh',
      introduction: 'Bác sĩ chuyên khoa Tim mạch với 15 năm kinh nghiệm.',
      educationLevel: EDUCATIONLEVEL.PROFESSIONAL
    }
  })

  await Promise.all([
    prisma.positionStaff.create({
      data: { positionId: doctorPosition.id, staffId: cardioStaff.id }
    }),
    prisma.staffOnDepartment.create({
      data: { staffId: cardioStaff.id, departmentId: cardiologyDept.id }
    })
  ])

  // Bác sĩ Thần kinh
  const neuroWallet = await blockchainService.createNewWallet()
  const neuroEncryptedMnemonic = cryptoJs.AES.encrypt(neuroWallet.mnemonic, SECRET_KEY).toString()
  const neuroHashedPassword = await createHashedPassword('doctor123')

  const neuroAccount = await prisma.account.create({
    data: {
      roleId: staffRole.id,
      username: 'bs.huong',
      password: neuroHashedPassword,
      email: 'bshuong@benhvien.vn',
      phoneNumber: '0903456789',
      walletAddress: neuroWallet.pair.address,
      walletMnemonic: neuroEncryptedMnemonic,
      emailIsVerified: true
    }
  })

  const neuroStaff = await prisma.staff.create({
    data: {
      accountId: neuroAccount.id,
      firstname: 'Lê',
      lastname: 'Thị Hương',
      introduction: 'Bác sĩ chuyên khoa Thần kinh, chuyên điều trị các bệnh lý về não bộ và hệ thần kinh.',
      educationLevel: EDUCATIONLEVEL.PROFESSIONAL
    }
  })

  await Promise.all([
    prisma.positionStaff.create({
      data: { positionId: doctorPosition.id, staffId: neuroStaff.id }
    }),
    prisma.staffOnDepartment.create({
      data: { staffId: neuroStaff.id, departmentId: neurologyDept.id }
    })
  ])

  // Bác sĩ Nội tổng hợp
  const generalWallet = await blockchainService.createNewWallet()
  const generalEncryptedMnemonic = cryptoJs.AES.encrypt(generalWallet.mnemonic, SECRET_KEY).toString()
  const generalHashedPassword = await createHashedPassword('doctor123')

  const generalAccount = await prisma.account.create({
    data: {
      roleId: staffRole.id,
      username: 'bs.duc.dk', // Đổi username
      password: generalHashedPassword,
      email: 'bsducdk@benhvien.vn', // Đổi email
      phoneNumber: '0904567890',
      walletAddress: generalWallet.pair.address,
      walletMnemonic: generalEncryptedMnemonic,
      emailIsVerified: true
    }
  })

  const generalStaff = await prisma.staff.create({
    data: {
      accountId: generalAccount.id,
      firstname: 'Phạm',
      lastname: 'Văn Đức',
      introduction: 'Bác sĩ Nội tổng hợp với kinh nghiệm điều trị đa dạng các bệnh lý nội khoa.',
      educationLevel: EDUCATIONLEVEL.MASTER
    }
  })

  await Promise.all([
    prisma.positionStaff.create({
      data: { positionId: doctorPosition.id, staffId: generalStaff.id }
    }),
    prisma.staffOnDepartment.create({
      data: { staffId: generalStaff.id, departmentId: generalDept.id }
    })
  ])

  // ================ TẠO TÀI KHOẢN Y TÁ ================
  console.log('Tạo tài khoản y tá...')

  const nurseAccounts = [
    {
      username: 'yta.mai',
      email: 'ytamai@benhvien.vn',
      phone: '0907890123',
      firstName: 'Vũ',
      lastName: 'Thị Mai',
      intro: 'Y tá trưởng khoa Tim mạch với 15 năm kinh nghiệm.',
      education: EDUCATIONLEVEL.BACHELOR,
      department: cardiologyDept.id
    },
    {
      username: 'yta.hong',
      email: 'ytahong@benhvien.vn',
      phone: '0908901234',
      firstName: 'Đỗ',
      lastName: 'Thị Hồng',
      intro: 'Y tá khoa Thần kinh, chuyên chăm sóc bệnh nhân.',
      education: EDUCATIONLEVEL.BACHELOR,
      department: neurologyDept.id
    },
    {
      username: 'yta.thu',
      email: 'ytatthu@benhvien.vn',
      phone: '0909012345',
      firstName: 'Bùi',
      lastName: 'Thị Thu',
      intro: 'Y tá khoa Nội tổng hợp.',
      education: EDUCATIONLEVEL.ASSOCIATE,
      department: generalDept.id
    }
  ]

  for (const nurseData of nurseAccounts) {
    const wallet = await blockchainService.createNewWallet()
    const encryptedMnemonic = cryptoJs.AES.encrypt(wallet.mnemonic, SECRET_KEY).toString()
    const hashedPassword = await createHashedPassword('nurse123')

    const account = await prisma.account.create({
      data: {
        roleId: staffRole.id, // Vai trò Nhân viên
        username: nurseData.username,
        password: hashedPassword,
        email: nurseData.email,
        phoneNumber: nurseData.phone,
        walletAddress: wallet.pair.address,
        walletMnemonic: encryptedMnemonic,
        emailIsVerified: true
      }
    })

    const staff = await prisma.staff.create({
      data: {
        accountId: account.id,
        firstname: nurseData.firstName,
        lastname: nurseData.lastName,
        introduction: nurseData.intro,
        educationLevel: nurseData.education
      }
    })

    await Promise.all([
      prisma.positionStaff.create({
        data: { positionId: nursePosition.id, staffId: staff.id }
      }),
      prisma.staffOnDepartment.create({
        data: { staffId: staff.id, departmentId: nurseData.department }
      })
    ])
  }

  // ================ TẠO TÀI KHOẢN LỄ TÂN ================
  console.log('Tạo tài khoản lễ tân...')

  const receptionistWallet = await blockchainService.createNewWallet()
  const receptionistEncryptedMnemonic = cryptoJs.AES.encrypt(receptionistWallet.mnemonic, SECRET_KEY).toString()
  const receptionistHashedPassword = await createHashedPassword('reception123')

  const receptionistAccount = await prisma.account.create({
    data: {
      roleId: staffRole.id, // Vai trò Nhân viên
      username: 'lt.linh',
      password: receptionistHashedPassword,
      email: 'letanlinh@benhvien.vn',
      phoneNumber: '0906789123',
      walletAddress: receptionistWallet.pair.address,
      walletMnemonic: receptionistEncryptedMnemonic,
      emailIsVerified: true
    }
  })

  const receptionistStaff = await prisma.staff.create({
    data: {
      accountId: receptionistAccount.id,
      firstname: 'Nguyễn',
      lastname: 'Thị Linh',
      introduction: 'Lễ tân chính, phụ trách tiếp đón và hướng dẫn bệnh nhân.',
      educationLevel: EDUCATIONLEVEL.ASSOCIATE
    }
  })

  await Promise.all([
    prisma.positionStaff.create({
      data: { positionId: receptionistPosition.id, staffId: receptionistStaff.id }
    }),
    prisma.staffOnDepartment.create({
      data: { staffId: receptionistStaff.id, departmentId: generalDept.id }
    })
  ])

  // ================ TẠO TÀI KHOẢN BỆNH NHÂN ================
  console.log('Tạo tài khoản bệnh nhân...')

  const patientData = [
    {
      username: 'bn.nguyenhoang',
      email: 'nguyenhoang@gmail.com',
      phone: '0910123456',
      firstName: 'Nguyễn',
      lastName: 'Văn Hoàng',
      address: '45 Phố Huế, Hai Bà Trưng, Hà Nội'
    },
    {
      username: 'bn.lethimai',
      email: 'lethimai@gmail.com',
      phone: '0911234567',
      firstName: 'Lê',
      lastName: 'Thị Mai',
      address: '67 Đường Trần Hưng Đạo, Hoàn Kiếm, Hà Nội'
    },
    {
      username: 'bn.tranvannam',
      email: 'tranvannam@gmail.com',
      phone: '0912345678',
      firstName: 'Trần',
      lastName: 'Văn Nam',
      address: '123 Phố Tây Sơn, Đống Đa, Hà Nội'
    },
    {
      username: 'bn.phamthiha',
      email: 'phamthiha@gmail.com',
      phone: '0913456789',
      firstName: 'Phạm',
      lastName: 'Thị Hà',
      address: '89 Đường Nguyễn Trãi, Thanh Xuân, Hà Nội'
    },
    {
      username: 'bn.vuvantuan',
      email: 'vuvantuan@gmail.com',
      phone: '0914567890',
      firstName: 'Vũ',
      lastName: 'Văn Tuấn',
      address: '156 Phố Láng, Đống Đa, Hà Nội'
    }
  ]

  const users: User[] = []
  const patients: Patient[] = []

  for (const patientInfo of patientData) {
    const wallet = await blockchainService.createNewWallet()
    const encryptedMnemonic = cryptoJs.AES.encrypt(wallet.mnemonic, SECRET_KEY).toString()
    const hashedPassword = await createHashedPassword('patient123')

    const account = await prisma.account.create({
      data: {
        roleId: userRole.id,
        username: patientInfo.username,
        password: hashedPassword,
        email: patientInfo.email,
        phoneNumber: patientInfo.phone,
        walletAddress: wallet.pair.address,
        walletMnemonic: encryptedMnemonic,
        emailIsVerified: true
      }
    })

    const user = await prisma.user.create({
      data: {
        accountId: account.id,
        firstname: patientInfo.firstName,
        lastname: patientInfo.lastName,
        phoneNumber: patientInfo.phone,
        address: patientInfo.address
      }
    })

    const patient = await prisma.patient.create({
      data: {
        userId: user.id,
        firstname: patientInfo.firstName,
        lastname: patientInfo.lastName,
        phoneNumber: patientInfo.phone,
        address: patientInfo.address
      }
    })

    users.push(user)
    patients.push(patient)
  }

  // ================ TẠO THỜI GIAN PHÒNG KHÁM ================
  console.log('Tạo lịch thời gian phòng khám...')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const medicalRoomTimes: MedicalRoomTime[] = []

  // Tạo lịch cho 14 ngày tới
  for (let day = 0; day < 14; day++) {
    const currentDate = new Date(today)
    currentDate.setDate(currentDate.getDate() + day)

    const dayOfWeek = currentDate.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    // Bỏ qua chủ nhật, giảm khung giờ thứ 7
    if (dayOfWeek === 0) continue

    const morningHours = isWeekend ? [8, 9, 10, 11] : [7, 8, 9, 10, 11]
    const afternoonHours = isWeekend ? [14, 15, 16] : [13, 14, 15, 16, 17]

    for (const room of rooms) {
      // Khung giờ sáng
      for (const hour of morningHours) {
        const fromTime = new Date(currentDate)
        fromTime.setHours(hour, 0, 0, 0)

        const toTime = new Date(fromTime)

        // Thời gian dựa trên loại dịch vụ
        if (room.serviceId === vaccinationService.id) {
          toTime.setMinutes(15) // Tiêm vắc xin 15 phút
        } else if (room.serviceId === paidExamService.id) {
          toTime.setMinutes(30) // Khám dịch vụ 30 phút
        } else if (room.serviceId === insuranceExamService.id) {
          toTime.setMinutes(20) // Khám bảo hiểm 20 phút
        } else {
          toTime.setMinutes(25) // Mặc định 25 phút
        }

        const roomTime = await prisma.medicalRoomTime.create({
          data: {
            roomId: room.id,
            fromTime,
            toTime
          }
        })
        medicalRoomTimes.push(roomTime)
      }

      // Khung giờ chiều (trừ khoa tiêm chủng cuối tuần)
      const shouldHaveAfternoonSlot = !(room.serviceId === vaccinationService.id && isWeekend)

      if (shouldHaveAfternoonSlot) {
        for (const hour of afternoonHours) {
          const fromTime = new Date(currentDate)
          fromTime.setHours(hour, 0, 0, 0)

          const toTime = new Date(fromTime)

          if (room.serviceId === vaccinationService.id) {
            toTime.setMinutes(15)
          } else if (room.serviceId === paidExamService.id) {
            toTime.setMinutes(30)
          } else if (room.serviceId === insuranceExamService.id) {
            toTime.setMinutes(20)
          } else {
            toTime.setMinutes(25)
          }

          const roomTime = await prisma.medicalRoomTime.create({
            data: {
              roomId: room.id,
              fromTime,
              toTime
            }
          })
          medicalRoomTimes.push(roomTime)
        }
      }
    }
  }

  // ================ TẠO CA LÀM VIỆC ================
  console.log('Tạo ca làm việc cho bác sĩ...')

  const allStaff = [deptHeadStaff, dentistStaff, pulmonologistStaff, gastroenterologistStaff, vaccinationNurseStaff]
  const roomsByDept = {
    [dentistryDept.id]: rooms.slice(0, 2),
    [cardiologyDept.id]: rooms.slice(2, 4),
    [pulmonologyDept.id]: rooms.slice(4, 6),
    [generalDept.id]: rooms.slice(6, 8),
    [neurologyDept.id]: rooms.slice(8, 10),
    [gastroenterologyDept.id]: rooms.slice(10, 12),
    [vaccinationDept.id]: rooms.slice(12, 14)
  }

  for (let day = 0; day < 14; day++) {
    const currentDate = new Date(today)
    currentDate.setDate(currentDate.getDate() + day)

    const dayOfWeek = currentDate.getDay()
    if (dayOfWeek === 0) continue // Bỏ qua chủ nhật

    for (const staff of allStaff) {
      // Lấy khoa của bác sĩ
      const staffDept = await prisma.staffOnDepartment.findFirst({
        where: { staffId: staff.id }
      })

      if (!staffDept) continue

      const deptRooms = roomsByDept[staffDept.departmentId] || []

      // Tạo ca sáng (7:30-12:00)
      const morningStart = new Date(currentDate)
      morningStart.setHours(7, 30, 0, 0)

      const morningEnd = new Date(currentDate)
      morningEnd.setHours(12, 0, 0, 0)

      if (deptRooms.length > 0) {
        await prisma.shiftWorking.create({
          data: {
            doctorId: staff.id,
            roomId: deptRooms[0].id, // Phòng khám chính
            fromTime: morningStart,
            toTime: morningEnd
          }
        })
      }

      // Ca chiều cho một số bác sĩ (13:30-17:30)
      const shouldWorkAfternoon = dayOfWeek !== 6 && Math.random() > 0.3 // 70% có ca chiều, trừ thứ 7

      if (shouldWorkAfternoon && deptRooms.length > 0) {
        const afternoonStart = new Date(currentDate)
        afternoonStart.setHours(13, 30, 0, 0)

        const afternoonEnd = new Date(currentDate)
        afternoonEnd.setHours(17, 30, 0, 0)

        // Chọn phòng khác nếu có
        const roomIndex = deptRooms.length > 1 ? 1 : 0

        await prisma.shiftWorking.create({
          data: {
            doctorId: staff.id,
            roomId: deptRooms[roomIndex].id,
            fromTime: afternoonStart,
            toTime: afternoonEnd
          }
        })
      }
    }
  }

  // ================ TẠO BOOKING VÀ APPOINTMENT MẪU ================
  console.log('Tạo booking và appointment mẫu...')

  // Tạo một số booking và appointment cho 3 ngày tới
  const futureRoomTimes = medicalRoomTimes.filter((rt) => {
    const timeDate = new Date(rt.fromTime)
    const threeDaysLater = new Date(today)
    threeDaysLater.setDate(threeDaysLater.getDate() + 3)
    return timeDate >= today && timeDate <= threeDaysLater
  })

  // Tạo khoảng 15-20 appointments
  const numAppointments = Math.min(20, Math.floor(futureRoomTimes.length * 0.3))
  const selectedTimes = futureRoomTimes.sort(() => Math.random() - 0.5).slice(0, numAppointments)

  for (let i = 0; i < selectedTimes.length; i++) {
    const roomTime = selectedTimes[i]
    const patient = patients[i % patients.length]
    const user = users[i % users.length]

    // Tạo booking
    const booking = await prisma.bookingTime.create({
      data: {
        medicalRoomTimeId: roomTime.id,
        userId: user.id,
        patientId: patient.id
      }
    })

    // Tạo appointment với status ngẫu nhiên
    const statuses = [APPOINTMENTSTATUS.BOOKED, APPOINTMENTSTATUS.PAID, APPOINTMENTSTATUS.CANCEL]
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]

    const appointment = await prisma.appointment.create({
      data: {
        medicalRoomId: roomTime.roomId,
        userId: user.id,
        bookingTimeId: booking.id,
        patientId: patient.id,
        status: randomStatus
      }
    })

    // Tạo status log
    await prisma.appointmentStatusLog.create({
      data: {
        appointmentId: appointment.id,
        status: randomStatus
      }
    })

    // Tạo một số diagnosis suggestions cho appointments đã hoàn thành
    if (randomStatus === APPOINTMENTSTATUS.PAID && Math.random() > 0.5) {
      const diseases = [
        'Tăng huyết áp nhẹ',
        'Viêm họng cấp',
        'Đau đầu căng thẳng',
        'Viêm dạ dày',
        'Cảm cúm thông thường',
        'Đau lưng cơ học',
        'Viêm khớp nhẹ'
      ]

      await prisma.diagnosisSuggestion.create({
        data: {
          appointmentId: appointment.id,
          suggestedByAI: Math.random() > 0.6 ? 'TRUE' : 'FALSE',
          disease: diseases[Math.floor(Math.random() * diseases.length)],
          confidence: 0.7 + Math.random() * 0.3, // 70-100%
          description: 'Chẩn đoán dựa trên triệu chứng và khám lâm sàng'
        }
      })
    }
  }

  console.log('✅ Khởi tạo dữ liệu mẫu hoàn tất!')
  console.log(`
📊 THỐNG KÊ DỮ LIỆU ĐÃ TẠO:
   👥 Vai trò: 3 (Quản trị viên, Nhân viên, Người dùng)
   🏢 Địa điểm: 3  
   🏥 Khoa: 7 (Răng Hàm Mặt, Tim Mạch, Hô Hấp, Đa Khoa, Thần Kinh, Tiêu Hóa, Tiêm Chủng)
   💼 Chức vụ: 4 (Bác sĩ, Y tá, Lễ tân, Trưởng khoa)
   🛏️ Phòng khám: ${rooms.length}
   🩺 Dịch vụ: 3 (Khám Bảo Hiểm, Khám Dịch Vụ, Tiêm Vắc Xin)
   👨‍⚕️ Bác sĩ: 4
   👩‍⚕️ Y tá: 2
   👤 Lễ tân: 1
   👨‍💼 Trưởng khoa: 1 (kiêm Bác sĩ)
   🤒 Bệnh nhân: 5

🔐 THÔNG TIN ĐĂNG NHẬP:
   🔹 Quản trị viên: admin / admin123
   🔹 Trưởng khoa Tim Mạch: tk.tinh / truongkhoa123
   🔹 Bác sĩ Răng Hàm Mặt: bs.duc.rhm / doctor123
   🔹 Bác sĩ Hô Hấp: bs.linh / doctor123
   🔹 Bác sĩ Tiêu Hóa: bs.nam / doctor123
   🔹 Bác sĩ Đa Khoa: bs.duc.dk / doctor123
   🔹 Bác sĩ Tim Mạch: bs.minh / doctor123
   🔹 Bác sĩ Thần Kinh: bs.huong / doctor123
   🔹 Y tá Tiêm Chủng: yta.hoa / nurse123
   🔹 Y tá Tim Mạch: yta.mai / nurse123
   🔹 Y tá Thần Kinh: yta.hong / nurse123
   🔹 Y tá Đa Khoa: yta.thu / nurse123
   🔹 Lễ tân: lt.linh / reception123
   🔹 Bệnh nhân: bn.nguyenhoang / patient123

🏥 KHOA VÀ DỊCH VỤ:
   🦷 Khoa Răng Hàm Mặt (RHM) - Tầng 1: Khám Bảo Hiểm, Khám Dịch Vụ
   ❤️ Khoa Tim Mạch (TIM) - Tầng 2: Khám Bảo Hiểm, Khám Dịch Vụ  
   🫁 Khoa Hô Hấp (HH) - Tầng 3: Khám Bảo Hiểm, Khám Dịch Vụ
   🏥 Khoa Đa Khoa (DK) - Tầng 4: Khám Bảo Hiểm, Khám Dịch Vụ
   🧠 Khoa Thần Kinh (TK) - Chi nhánh Tầng 1: Khám Bảo Hiểm, Khám Dịch Vụ
   🍽️ Khoa Tiêu Hóa (TH) - Chi nhánh Tầng 2: Khám Bảo Hiểm, Khám Dịch Vụ
   💉 Khoa Tiêm Chủng (TC) - Trung tâm cấp cứu Tầng 1: Tiêm Vắc Xin
  `)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Lỗi khi khởi tạo dữ liệu:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
