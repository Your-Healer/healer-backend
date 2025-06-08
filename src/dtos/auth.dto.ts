import { Position, PositionStaff } from '@prisma/client'

export interface LoginDto {
  identifier: string // username, email, or phone
  password: string
  type: 'username' | 'email' | 'phone'
}

export interface LoginResponse {
  token: string
  user?: {
    id: string
    firstname: string
    lastname: string
  }
  staff?: {
    id: string
    firstname: string
    lastname: string
    positions?: { positionId: string }[]
  }
  account: {
    id: string
    role?: {
      id: string
      name: string
    }
    avatar?: string
    emailIsVerified: boolean
  }
}

export interface RegisterDto {
  username: string
  firstname: string
  lastname: string
  email: string
  phoneNumber: string
  password: string
  confirmPassword: string
  roleId?: string
}
