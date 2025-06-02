import prisma from '~/libs/prisma/init'
import { Staff, EDUCATIONLEVEL, Account, ShiftWorking, Appointment } from '@prisma/client'
import { createHashedPassword } from '~/middlewares/auth'

export default class StaffService {
  private static instance: StaffService
  private constructor() {}

  static getInstance() {
    if (!StaffService.instance) {
      StaffService.instance = new StaffService()
    }
    return StaffService.instance
  }

  async createStaff(data: {
    accountId: string
    firstname: string
    lastname: string
    introduction?: string
    educationLevel?: EDUCATIONLEVEL
    positionIds?: string[]
    departmentIds?: string[]
  }): Promise<Staff> {
    const { accountId, firstname, lastname, introduction, educationLevel, positionIds, departmentIds } = data

    const staff = await prisma.staff.create({
      data: {
        accountId,
        firstname,
        lastname,
        introduction,
        educationLevel
      }
    })

    // Assign positions if provided
    if (positionIds && positionIds.length > 0) {
      await Promise.all(
        positionIds.map((positionId) =>
          prisma.positionStaff.create({
            data: {
              staffId: staff.id,
              positionId
            }
          })
        )
      )
    }

    // Assign departments if provided
    if (departmentIds && departmentIds.length > 0) {
      await Promise.all(
        departmentIds.map((departmentId) =>
          prisma.staffOnDepartment.create({
            data: {
              staffId: staff.id,
              departmentId
            }
          })
        )
      )
    }

    return staff
  }

  async createNewStaff(data: {
    roleId: string
    username: string
    password: string
    email: string
    firstname: string
    lastname: string
    walletAddress: string
    walletMnemonic: string
    phoneNumber?: string
    introduction?: string
    educationLevel?: EDUCATIONLEVEL
    positionIds?: string[]
    departmentIds?: string[]
  }): Promise<{ account: Account; staff: Staff }> {
    const {
      roleId,
      username,
      password,
      email,
      firstname,
      lastname,
      walletAddress,
      walletMnemonic,
      phoneNumber,
      introduction,
      educationLevel,
      positionIds,
      departmentIds
    } = data

    const hashedPassword = await createHashedPassword(password)

    const account = await prisma.account.create({
      data: {
        roleId,
        username,
        password: hashedPassword,
        email,
        firstname,
        lastname,
        walletAddress,
        walletMnemonic,
        phoneNumber,
        emailIsVerified: false
      }
    })

    const staff = await this.createStaff({
      accountId: account.id,
      firstname,
      lastname,
      introduction,
      educationLevel,
      positionIds,
      departmentIds
    })

    return { account, staff }
  }

  async getStaffById(id: string): Promise<Staff | null> {
    return await prisma.staff.findUnique({
      where: { id },
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
        account: true
      }
    })
  }

  async getStaffByAccountId(accountId: string): Promise<Staff | null> {
    return await prisma.staff.findUnique({
      where: { accountId },
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
        }
      }
    })
  }

  async getStaffShifts(staffId: string, fromDate?: Date, toDate?: Date): Promise<ShiftWorking[]> {
    const dateFilter: any = {}

    if (fromDate) {
      dateFilter['gte'] = fromDate
    }

    if (toDate) {
      dateFilter['lte'] = toDate
    }

    const whereClause: any = { doctorId: staffId }
    if (Object.keys(dateFilter).length > 0) {
      whereClause.fromTime = dateFilter
    }

    return await prisma.shiftWorking.findMany({
      where: whereClause,
      include: {
        room: {
          include: {
            department: true,
            service: true
          }
        }
      },
      orderBy: {
        fromTime: 'asc'
      }
    })
  }

  async getStaffPatients(staffId: string, date?: Date): Promise<Appointment[]> {
    // Get rooms where this staff is working
    const shifts = await prisma.shiftWorking.findMany({
      where: {
        doctorId: staffId
      },
      select: {
        roomId: true
      }
    })

    const roomIds = [...new Set(shifts.map((shift) => shift.roomId))]

    let whereClause: any = {
      medicalRoomId: { in: roomIds }
    }

    if (date) {
      // If specific date is provided, filter appointments for that date
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      whereClause.bookingTime = {
        medicalRoomTime: {
          fromTime: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      }
    }

    return await prisma.appointment.findMany({
      where: whereClause,
      include: {
        user: true,
        medicalRoom: {
          include: {
            service: true,
            department: true
          }
        },
        bookingTime: {
          include: {
            medicalRoomTime: true
          }
        }
      },
      orderBy: {
        bookingTime: {
          medicalRoomTime: {
            fromTime: 'asc'
          }
        }
      }
    })
  }
}
