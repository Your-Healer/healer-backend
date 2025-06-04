import { Department, Prisma } from '@prisma/client'
import { BaseService } from './base.service'
import prisma from '~/libs/prisma/init'

export interface CreateDepartmentData {
  locationId: string
  name: string
  symbol: string
  floor: number
}

export interface UpdateDepartmentData {
  locationId?: string
  name?: string
  symbol?: string
  floor?: number
}

export interface DepartmentFilter {
  locationId?: string
  floor?: number
  searchTerm?: string
}

export default class DepartmentService extends BaseService {
  private static instance: DepartmentService
  private constructor() {
    super()
  }

  static getInstance(): DepartmentService {
    if (!DepartmentService.instance) {
      this.instance = new DepartmentService()
    }
    return this.instance
  }

  async createDepartment(data: CreateDepartmentData): Promise<Department> {
    try {
      // Validate location exists
      const location = await prisma.location.findUnique({
        where: { id: data.locationId }
      })
      if (!location) {
        throw new Error('Location not found')
      }

      // Check if department symbol is unique within location
      const existingDept = await prisma.department.findFirst({
        where: {
          symbol: data.symbol,
          locationId: data.locationId
        }
      })
      if (existingDept) {
        throw new Error('Department symbol already exists in this location')
      }

      const departmentData: Prisma.DepartmentCreateInput = {
        location: { connect: { id: data.locationId } },
        name: data.name,
        symbol: data.symbol,
        floor: data.floor
      }

      return await prisma.department.create({
        data: departmentData
      })
    } catch (error) {
      this.handleError(error, 'createDepartment')
    }
  }

  async updateDepartment(id: string, data: UpdateDepartmentData): Promise<Department> {
    try {
      const existingDept = await prisma.department.findUnique({
        where: { id }
      })
      if (!existingDept) {
        throw new Error('Department not found')
      }

      // Validate location if changing
      if (data.locationId && data.locationId !== existingDept.locationId) {
        const location = await prisma.location.findUnique({
          where: { id: data.locationId }
        })
        if (!location) {
          throw new Error('New location not found')
        }
      }

      // Check symbol uniqueness if changing
      if (data.symbol && data.symbol !== existingDept.symbol) {
        const locationId = data.locationId || existingDept.locationId
        const symbolExists = await prisma.department.findFirst({
          where: {
            symbol: data.symbol,
            locationId: locationId,
            NOT: { id: id }
          }
        })
        if (symbolExists) {
          throw new Error('Department symbol already exists in this location')
        }
      }

      const updateData: Prisma.DepartmentUpdateInput = {
        location: data.locationId ? { connect: { id: data.locationId } } : undefined,
        name: data.name,
        symbol: data.symbol,
        floor: data.floor
      }

      return await prisma.department.update({
        where: { id },
        data: updateData
      })
    } catch (error) {
      this.handleError(error, 'updateDepartment')
    }
  }

  async getDepartmentById(id: string) {
    try {
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
                  account: true,
                  positions: {
                    include: {
                      position: true
                    }
                  }
                }
              }
            }
          }
        }
      })
    } catch (error) {
      this.handleError(error, 'getDepartmentById')
    }
  }

  async getDepartments(filter: DepartmentFilter = {}, page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      const where: any = {}

      if (filter.locationId) where.locationId = filter.locationId
      if (filter.floor !== undefined) where.floor = filter.floor

      if (filter.searchTerm) {
        where.OR = [
          { name: { contains: filter.searchTerm, mode: 'insensitive' } },
          { symbol: { contains: filter.searchTerm, mode: 'insensitive' } }
        ]
      }

      const [departments, total] = await Promise.all([
        prisma.department.findMany({
          skip,
          take,
          where,
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
                    account: true,
                    positions: {
                      include: {
                        position: true
                      }
                    }
                  }
                }
              }
            }
          }
        }),
        prisma.department.count({ where })
      ])

      return this.formatPaginationResult(departments, total, page, limit)
    } catch (error) {
      this.handleError(error, 'getDepartments')
    }
  }

  async getDepartmentsByLocation(locationId: string) {
    try {
      return await prisma.department.findMany({
        where: { locationId },
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
                  account: true,
                  positions: {
                    include: {
                      position: true
                    }
                  }
                }
              }
            }
          }
        }
      })
    } catch (error) {
      this.handleError(error, 'getDepartmentsByLocation')
    }
  }

  async getDepartmentMedicalRooms(departmentId: string, page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      const department = await prisma.department.findUnique({
        where: { id: departmentId }
      })
      if (!department) {
        throw new Error('Department not found')
      }

      const [rooms, total] = await Promise.all([
        prisma.medicalRoom.findMany({
          where: { departmentId },
          skip,
          take,
          include: {
            service: true,
            _count: {
              select: {
                times: true,
                shifts: true
              }
            }
          }
        }),
        prisma.medicalRoom.count({
          where: { departmentId }
        })
      ])

      return this.formatPaginationResult(rooms, total, page, limit)
    } catch (error) {
      this.handleError(error, 'getDepartmentMedicalRooms')
    }
  }

  async getDepartmentStaff(departmentId: string, page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      const staff = await prisma.staff.findMany({
        where: { departments: { some: { departmentId } } },
        include: {
          account: true,
          positions: {
            include: {
              position: true
            }
          }
        }
      })
      const total = staff.length

      // Apply pagination manually since findByDepartmentId doesn't support it
      const paginatedStaff = staff.slice(skip, skip + take)

      return this.formatPaginationResult(paginatedStaff, total, page, limit)
    } catch (error) {
      this.handleError(error, 'getDepartmentStaff')
    }
  }

  async assignStaffToDepartment(departmentId: string, staffId: string): Promise<void> {
    try {
      // Verify department exists
      const department = await prisma.department.findUnique({
        where: { id: departmentId }
      })
      if (!department) {
        throw new Error('Department not found')
      }

      // Verify staff exists
      const staff = await prisma.staff.findUnique({
        where: { id: staffId }
      })
      if (!staff) {
        throw new Error('Staff not found')
      }

      // Check if already assigned
      const existingAssignment = await prisma.staffOnDepartment.findFirst({
        where: {
          staffId,
          departmentId
        }
      })
      if (existingAssignment) {
        throw new Error('Staff is already assigned to this department')
      }

      await prisma.staffOnDepartment.create({
        data: {
          staff: { connect: { id: staffId } },
          department: { connect: { id: departmentId } }
        }
      })
    } catch (error) {
      this.handleError(error, 'assignStaffToDepartment')
    }
  }

  async removeStaffFromDepartment(departmentId: string, staffId: string): Promise<void> {
    try {
      // Verify assignment exists
      const assignment = await prisma.staffOnDepartment.findFirst({
        where: {
          staffId,
          departmentId
        }
      })
      if (!assignment) {
        throw new Error('Staff is not assigned to this department')
      }

      await prisma.staffOnDepartment.delete({
        where: {
          staffId_departmentId: {
            staffId,
            departmentId
          }
        }
      })
    } catch (error) {
      this.handleError(error, 'removeStaffFromDepartment')
    }
  }

  async deleteDepartment(id: string): Promise<void> {
    try {
      const department = await prisma.department.findUnique({
        where: { id },
        include: {
          medicalRooms: true,
          staffAssignments: true
        }
      })

      if (!department) {
        throw new Error('Department not found')
      }

      if (department.medicalRooms && department.medicalRooms.length > 0) {
        throw new Error('Cannot delete department with medical rooms. Delete medical rooms first.')
      }

      if (department.staffAssignments && department.staffAssignments.length > 0) {
        throw new Error('Cannot delete department with staff assignments. Remove staff assignments first.')
      }

      await prisma.department.delete({
        where: { id }
      })
    } catch (error) {
      this.handleError(error, 'deleteDepartment')
    }
  }

  async searchDepartments(searchTerm: string, page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = this.calculatePagination(page, limit)

      const departments = await prisma.department.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { symbol: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        skip,
        take
      })
      const total = await prisma.department.count({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { symbol: { contains: searchTerm, mode: 'insensitive' } }
          ]
        }
      })

      return this.formatPaginationResult(departments, total, page, limit)
    } catch (error) {
      this.handleError(error, 'searchDepartments')
    }
  }

  async getDepartmentStatistics(departmentId?: string) {
    try {
      const where: any = departmentId ? { id: departmentId } : {}

      const [totalDepartments, departmentsWithRooms, departmentsWithStaff, totalMedicalRooms, totalStaff] =
        await Promise.all([
          prisma.department.count(where),
          prisma.department.count({
            ...where,
            medicalRooms: { some: {} }
          }),
          prisma.department.count({
            ...where,
            staffAssignments: { some: {} }
          }),
          prisma.medicalRoom.count({
            where: {
              departmentId
            }
          }),
          prisma.staffOnDepartment.count({
            where: {
              departmentId
            }
          })
        ])

      const averageRoomsPerDepartment = totalDepartments > 0 ? totalMedicalRooms / totalDepartments : 0
      const averageStaffPerDepartment = totalDepartments > 0 ? totalStaff / totalDepartments : 0

      return {
        totalDepartments,
        departmentsWithRooms,
        departmentsWithStaff,
        totalMedicalRooms,
        totalStaff,
        averageRoomsPerDepartment: Math.round(averageRoomsPerDepartment * 100) / 100,
        averageStaffPerDepartment: Math.round(averageStaffPerDepartment * 100) / 100,
        utilizationRate: totalDepartments > 0 ? (departmentsWithRooms / totalDepartments) * 100 : 0
      }
    } catch (error) {
      this.handleError(error, 'getDepartmentStatistics')
    }
  }

  async getDepartmentsByFloor(locationId: string, floor: number) {
    try {
      return await prisma.department.findMany({
        where: {
          locationId,
          floor
        }
      })
    } catch (error) {
      this.handleError(error, 'getDepartmentsByFloor')
    }
  }

  async getAvailableFloorsInLocation(locationId: string) {
    try {
      const floors = await prisma.department.findMany({
        where: { locationId },
        select: { floor: true }
      })

      const uniqueFloors = Array.from(new Set(floors.map((f) => f.floor)))

      return uniqueFloors.sort((a, b) => a - b)
    } catch (error) {
      this.handleError(error, 'getAvailableFloorsInLocation')
    }
  }

  async bulkAssignStaff(departmentId: string, staffIds: string[]): Promise<void> {
    try {
      // Verify department exists
      const department = await prisma.department.findUnique({
        where: { id: departmentId }
      })
      if (!department) {
        throw new Error('Department not found')
      }

      // Verify all staff exist
      for (const staffId of staffIds) {
        const staff = await prisma.staff.findUnique({
          where: { id: staffId }
        })
        if (!staff) {
          throw new Error(`Staff with ID ${staffId} not found`)
        }
      }

      // Remove existing assignments and add new ones
      await prisma.staffOnDepartment.deleteMany({
        where: { departmentId }
      })

      const assignments = staffIds.map((staffId) => ({
        staffId,
        departmentId
      }))

      await prisma.staffOnDepartment.createMany({
        data: assignments
      })
    } catch (error) {
      this.handleError(error, 'bulkAssignStaff')
    }
  }

  async getAllDepartments() {
    try {
      return await prisma.department.findMany({
        include: {
          location: true
        }
      })
    } catch (error) {
      this.handleError(error, 'getAllDepartments')
    }
  }
}
