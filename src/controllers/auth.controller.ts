import { NextFunction, Request, Response } from 'express'
import prisma from '~/libs/prisma/init'
import { createHashedPassword, compareHashedPassword, createJWT } from '~/middlewares/auth/index'
import {} from '~/services/auth.service'
import BlockchainService from '~/services/blockchain.service'
import AuthService from '~/services/auth.service'

const blockchainService = BlockchainService.getInstance()
const authService = AuthService.getInstance()

export async function registerController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { username, password, email, phoneNumber, firstname, lastname, address } = req.body

    return res.status(201).json({
      message: 'Registration successful',
      userId: result.user.id
    })
  } catch (error) {
    console.error('Error registration:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function loginUsernameController(req: any, res: Response, next: NextFunction): Promise<any> {
  const { username, password }: { username: string; password: string } = req.body
  try {
    const result = await authService.login({
      identifier: username.toLowerCase().trim(),
      password,
      type: 'username'
    })

    req.session.token = result.token
    return res.status(200).json({
      message: 'Login successful',
      token: result.token,
      user: result.user,
      staff: result.staff,
      account: {
        id: result.account.id,
        role: result.account.role,
        emailIsVerified: result.account.emailIsVerified
      },
      expiresIn: '7d'
    })
  } catch (error: any) {
    console.error('Error login:', error)
    return res.status(401).json({ message: error.message || 'Invalid credentials' })
  }
}

export async function loginEmailController(req: any, res: Response, next: NextFunction): Promise<any> {
  const { email, password }: { email: string; password: string } = req.body
  try {
    const result = await authService.login({
      identifier: email,
      password,
      type: 'email'
    })

    req.session.token = result.token
    return res.status(200).json({
      message: 'Login successful',
      token: result.token,
      user: result.user,
      staff: result.staff,
      account: {
        id: result.account.id,
        role: result.account.role,
        emailIsVerified: result.account.emailIsVerified
      },
      expiresIn: '7d'
    })
  } catch (error: any) {
    console.error('Error login:', error)
    return res.status(401).json({ message: error.message || 'Invalid credentials' })
  }
}

export async function loginPhoneNumberController(req: any, res: Response, next: NextFunction): Promise<any> {
  const { phoneNumber, password }: { phoneNumber: string; password: string } = req.body
  try {
    const result = await authService.login({
      identifier: phoneNumber,
      password,
      type: 'phone'
    })

    req.session.token = result.token
    return res.status(200).json({
      message: 'Login successful',
      token: result.token,
      user: result.user,
      staff: result.staff,
      account: {
        id: result.account.id,
        role: result.account.role,
        emailIsVerified: result.account.emailIsVerified
      },
      expiresIn: '7d'
    })
  } catch (error: any) {
    console.error('Error login:', error)
    return res.status(401).json({ message: error.message || 'Invalid credentials' })
  }
}

export async function logoutController(req: Request, res: Response, next: NextFunction) {
  try {
    req.session.destroy((err: any) => {
      if (err) {
        return next(err)
      }
      return res.status(200).json({ message: 'Logout successful' })
    })
  } catch (error) {
    next(error)
  }
}

export async function refreshTokenController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { token } = req.body
    if (!token) {
      return res.status(400).json({ error: 'Token is required' })
    }

    const newToken = await refreshToken(token)
    return res.status(200).json({
      message: 'Token refreshed successfully',
      token: newToken,
      expiresIn: '7d'
    })
  } catch (error: any) {
    console.error('Error refreshing token:', error)
    return res.status(401).json({ message: error.message || 'Invalid token' })
  }
}

// export async function verifyEmailController(req: Request, res: Response, next: NextFunction): Promise<any> {
//   try {
//     const { token } = req.body

//     const { accountId } = verifyEmailVerificationToken(token)

//     await prisma.account.update({
//       where: { id: accountId },
//       data: { emailIsVerified: true }
//     })

//     return res.status(200).json({ message: 'Email verified successfully' })
//   } catch (error: any) {
//     console.error('Error verifying email:', error)
//     return res.status(400).json({ error: error.message || 'Invalid verification token' })
//   }
// }

// export async function requestPasswordResetController(req: Request, res: Response, next: NextFunction): Promise<any> {
//   try {
//     const { email } = req.body

//     const account = await prisma.account.findUnique({
//       where: { email }
//     })

//     if (!account) {
//       // Don't reveal if email exists for security
//       return res.status(200).json({
//         message: 'If an account with that email exists, a password reset link has been sent'
//       })
//     }

//     const resetToken = createPasswordResetToken(account.id)

//     // In production, you would send this token via email
//     // For now, we'll just return it (remove this in production)
//     return res.status(200).json({
//       message: 'Password reset token generated',
//       resetToken: resetToken // Remove this in production!
//     })
//   } catch (error: any) {
//     console.error('Error requesting password reset:', error)
//     return res.status(500).json({ error: 'Internal server error' })
//   }
// }

// export async function resetPasswordController(req: Request, res: Response, next: NextFunction): Promise<any> {
//   try {
//     const { email, newPassword, resetToken } = req.body

//     // Verify reset token
//     const { accountId } = verifyPasswordResetToken(resetToken)

//     // Verify the account matches the email
//     const account = await prisma.account.findUnique({
//       where: { id: accountId }
//     })

//     if (!account || account.email !== email) {
//       return res.status(400).json({ error: 'Invalid reset request' })
//     }

//     // Hash new password and update
//     const hashedPassword = await createHashedPassword(newPassword)

//     await prisma.account.update({
//       where: { id: accountId },
//       data: { password: hashedPassword }
//     })

//     return res.status(200).json({ message: 'Password reset successfully' })
//   } catch (error: any) {
//     console.error('Error resetting password:', error)
//     return res.status(400).json({ message: error.message || 'Invalid reset token' })
//   }
// }

export async function changePasswordController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountId } = (req as any).user
    const { currentPassword, newPassword } = req.body

    const account = await prisma.account.findUnique({
      where: { id: accountId }
    })

    if (!account) {
      return res.status(404).json({ error: 'Account not found' })
    }

    // Verify current password
    const isValidPassword = await compareHashedPassword(currentPassword, account.password)
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }

    // Hash new password
    const hashedNewPassword = await createHashedPassword(newPassword)

    await prisma.account.update({
      where: { id: accountId },
      data: { password: hashedNewPassword }
    })

    return res.status(200).json({ message: 'Password changed successfully' })
  } catch (error: any) {
    console.error('Error changing password:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export async function getCurrentUserController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { accountId } = (req as any).user

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        role: true,
        avatar: true,
        user: {
          include: {
            Patient: {
              include: {
                _count: {
                  select: {
                    Appointment: true
                  }
                }
              }
            }
          }
        },
        staff: {
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
        }
      }
    })

    if (!account) {
      return res.status(404).json({ error: 'Account not found' })
    }

    // Remove sensitive data
    const { password, walletMnemonic, ...safeAccount } = account

    return res.status(200).json({
      account: safeAccount,
      user: account.user,
      staff: account.staff
    })
  } catch (error: any) {
    console.error('Error getting current user:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
function refreshToken(token: any) {
  throw new Error('Function not implemented.')
}
