import { Request, Response, NextFunction } from 'express'
import prisma from '~/libs/prisma/init'

// Position IDs from seed data
const DOCTOR_POSITION = '1'
const NURSE_POSITION = '2'
const RECEPTIONIST_POSITION = '3'
const DEPARTMENT_HEAD_POSITION = '4'

// Position-based middleware
export const isDoctor = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { accountId } = req.user
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        staff: {
          include: {
            positions: {
              include: {
                position: true
              }
            }
          }
        }
      }
    })

    if (!account?.staff) {
      return res.status(403).json({ message: 'Access denied: Staff account required' })
    }

    const hasPosition = account.staff.positions.some((pos) => pos.position.id === DOCTOR_POSITION)

    if (!hasPosition) {
      return res.status(403).json({ message: 'Access denied: Doctor position required' })
    }

    next()
  } catch (error) {
    console.error('Error in doctor position middleware:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const isNurse = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { accountId } = req.user
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        staff: {
          include: {
            positions: {
              include: {
                position: true
              }
            }
          }
        }
      }
    })

    if (!account?.staff) {
      return res.status(403).json({ message: 'Access denied: Staff account required' })
    }

    const hasPosition = account.staff.positions.some((pos) => pos.position.id === NURSE_POSITION)

    if (!hasPosition) {
      return res.status(403).json({ message: 'Access denied: Nurse position required' })
    }

    next()
  } catch (error) {
    console.error('Error in nurse position middleware:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const isReceptionist = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { accountId } = req.user
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        staff: {
          include: {
            positions: {
              include: {
                position: true
              }
            }
          }
        }
      }
    })

    if (!account?.staff) {
      return res.status(403).json({ message: 'Access denied: Staff account required' })
    }

    const hasPosition = account.staff.positions.some((pos) => pos.position.id === RECEPTIONIST_POSITION)

    if (!hasPosition) {
      return res.status(403).json({ message: 'Access denied: Receptionist position required' })
    }

    next()
  } catch (error) {
    console.error('Error in receptionist position middleware:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const isDepartmentHead = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { accountId } = req.user
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        staff: {
          include: {
            positions: {
              include: {
                position: true
              }
            }
          }
        }
      }
    })

    if (!account?.staff) {
      return res.status(403).json({ message: 'Access denied: Staff account required' })
    }

    const hasPosition = account.staff.positions.some((pos) => pos.position.id === DEPARTMENT_HEAD_POSITION)

    if (!hasPosition) {
      return res.status(403).json({ message: 'Access denied: Department head position required' })
    }

    next()
  } catch (error) {
    console.error('Error in department head position middleware:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const isMedicalStaff = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { accountId } = req.user
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        staff: {
          include: {
            positions: {
              include: {
                position: true
              }
            }
          }
        }
      }
    })

    if (!account?.staff) {
      return res.status(403).json({ message: 'Access denied: Staff account required' })
    }

    const hasMedicalPosition = account.staff.positions.some(
      (pos) => pos.position.id === DOCTOR_POSITION || pos.position.id === NURSE_POSITION
    )

    if (!hasMedicalPosition) {
      return res.status(403).json({ message: 'Access denied: Medical staff position required' })
    }

    next()
  } catch (error) {
    console.error('Error in medical staff position middleware:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const hasAnyPosition = (positions: string[]) => {
  return async (req: any, res: Response, next: NextFunction): Promise<any> => {
    try {
      const { accountId } = req.user
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        include: {
          staff: {
            include: {
              positions: {
                include: {
                  position: true
                }
              }
            }
          }
        }
      })

      if (!account?.staff) {
        return res.status(403).json({ message: 'Access denied: Staff account required' })
      }

      const hasRequiredPosition = account.staff.positions.some((pos) => positions.includes(pos.position.id))

      if (!hasRequiredPosition) {
        return res.status(403).json({ message: 'Access denied: Required position not found' })
      }

      next()
    } catch (error) {
      console.error('Error in position check middleware:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
}
