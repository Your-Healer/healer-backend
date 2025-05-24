import { Request, Response, NextFunction } from 'express'
import prisma from '~/libs/prisma/init'

// Role IDs
const ADMIN_ROLE = 'ADMIN'
const DOCTOR_ROLE = 'DOCTOR'
const NURSE_ROLE = 'NURSE'
const RECEPTIONIST_ROLE = 'RECEPTIONIST'
const PATIENT_ROLE = 'USER'

// Role-based middleware
export const isAdmin = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.user
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { role: true }
    })

    if (!account || account.role.name !== ADMIN_ROLE) {
      return res.status(403).json({ message: 'Access denied: Admin privileges required' })
    }

    next()
  } catch (error) {
    console.error('Error in admin middleware:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const isDoctor = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { accountId } = req.user
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { role: true }
    })

    if (!account || account.role.name !== DOCTOR_ROLE) {
      return res.status(403).json({ message: 'Access denied: Doctor privileges required' })
    }

    next()
  } catch (error) {
    console.error('Error in doctor middleware:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const isNurse = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.user
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { role: true }
    })

    if (!account || account.role.name !== NURSE_ROLE) {
      return res.status(403).json({ message: 'Access denied: Nurse privileges required' })
    }

    next()
  } catch (error) {
    console.error('Error in nurse middleware:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const isReceptionist = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { accountId } = req.user
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { role: true }
    })

    if (!account || account.role.name !== RECEPTIONIST_ROLE) {
      return res.status(403).json({ message: 'Access denied: Receptionist privileges required' })
    }

    next()
  } catch (error) {
    console.error('Error in receptionist middleware:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const isPatient = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { accountId } = req.user
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { role: true }
    })

    if (!account || account.role.name !== PATIENT_ROLE) {
      return res.status(403).json({ message: 'Access denied: Patient privileges required' })
    }

    next()
  } catch (error) {
    console.error('Error in patient middleware:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const isStaff = async (req: any, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { accountId } = req.user
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { role: true }
    })

    if (!account || ![ADMIN_ROLE, DOCTOR_ROLE, NURSE_ROLE, RECEPTIONIST_ROLE].includes(account.role.name)) {
      return res.status(403).json({ message: 'Access denied: Staff privileges required' })
    }

    next()
  } catch (error) {
    console.error('Error in staff middleware:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
