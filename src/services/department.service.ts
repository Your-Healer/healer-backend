import { Department, MedicalRoom, StaffOnDepartment } from '@prisma/client'
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

  async getAllDepartments(): Promise<Department[]> {
    return await prisma.department.findMany({
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

  async getDepartmentById(id: string): Promise<Department | null> {
    return await prisma.department.findUnique({
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

  async getMedicalRoomsByDepartment(departmentId: string): Promise<MedicalRoom[]> {
    return await prisma.medicalRoom.findMany({
      where: { departmentId },
      include: {
        service: true
      }
    })
  }

  async getStaffByDepartment(departmentId: string): Promise<StaffOnDepartment[]> {
    return await prisma.staffOnDepartment.findMany({
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
