import prisma from '~/libs/prisma/init'

export class DepartmentService {
  private static instance: DepartmentService
  private constructor() {}

  static getInstance() {
    if (!DepartmentService.instance) {
      DepartmentService.instance = new DepartmentService()
    }
    return DepartmentService.instance
  }

  async getAllDepartments() {
    return prisma.department.findMany({
      include: {
        location: true,
        medicalRooms: {
          include: {
            service: true
          }
        }
      }
    })
  }

  async getDepartmentById(id: string) {
    return prisma.department.findUnique({
      where: { id },
      include: {
        location: true,
        medicalRooms: {
          include: {
            service: true
          }
        },
        staffAssignments: {
          include: {
            staff: {
              include: {
                positions: {
                  include: {
                    position: true
                  }
                },
                account: true
              }
            }
          }
        }
      }
    })
  }

  async getMedicalRoomsByDepartment(departmentId: string) {
    return prisma.medicalRoom.findMany({
      where: { departmentId },
      include: {
        service: true
      }
    })
  }

  async getStaffByDepartment(departmentId: string) {
    return prisma.staffOnDepartment.findMany({
      where: { departmentId },
      include: {
        staff: {
          include: {
            positions: {
              include: {
                position: true
              }
            },
            account: true
          }
        }
      }
    })
  }
}
