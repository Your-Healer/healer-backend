import { Request, Response, NextFunction } from 'express'

export const isAdmin = (req: any, res: Response, next: NextFunction): any => {
  if (req.user?.role !== 'Quản trị viên') {
    return res.status(403).json({
      message: 'Access denied: Admin privileges required'
    })
  }
  next()
}

export const isStaff = (req: any, res: Response, next: NextFunction): any => {
  const allowedRoles = ['Nhân viên', 'Quản trị viên']
  if (!allowedRoles.includes(req.user?.role)) {
    return res.status(403).json({
      message: 'Access denied: Staff privileges required'
    })
  }
  next()
}

export const isUser = (req: any, res: Response, next: NextFunction): any => {
  const allowedRoles = ['Người dùng', 'Nhân viên', 'Quản trị viên']
  if (!allowedRoles.includes(req.user?.role)) {
    return res.status(403).json({
      message: 'Access denied: User privileges required'
    })
  }
  next()
}

export const isReceptionist = (req: any, res: Response, next: NextFunction): any => {
  const allowedRoles = ['Lễ tân', 'Quản trị viên']
  if (!allowedRoles.includes(req.user?.role)) {
    return res.status(403).json({
      message: 'Access denied: Receptionist privileges required'
    })
  }
  next()
}

export const isPatient = (req: any, res: Response, next: NextFunction): any => {
  if (req.user?.role !== 'Người dùng') {
    return res.status(403).json({
      message: 'Access denied: Patient privileges required'
    })
  }
  next()
}

export const hasAnyRole = (roles: string[]) => {
  return (req: any, res: Response, next: NextFunction): any => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        message: `Access denied: Required roles: ${roles.join(', ')}`
      })
    }
    next()
  }
}
