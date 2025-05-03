import { NextFunction, Request, Response } from 'express'
import WalletService from '~/services/wallet.service'

const walletService = WalletService.getInstance()

export async function registerController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const pair = await walletService.createNewWallet()
    const { address } = pair
    console.log('Key pair: ', pair)
    console.log('Address: ', address)

    return res.status(200).json({ address, pair })
  } catch (error) {
    console.error('Error creating wallet:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// export async function login(req: Request, res: Response, next: NextFunction) {
//   try {
//     // Simulate login logic
//     const { username, password } = req.body
//     if (username === 'admin' && password === 'password') {
//       req.session.user = { username }
//       return res.status(200).json({ message: 'Login successful' })
//     } else {
//       return res.status(401).json({ message: 'Invalid credentials' })
//     }
//   } catch (error) {
//     next(error)
//   }
// }

// export async function logout(req: Request, res: Response, next: NextFunction) {
//   try {
//     req.session.destroy((err) => {
//       if (err) {
//         return next(err)
//       }
//       return res.status(200).json({ message: 'Logout successful' })
//     })
//   } catch (error) {
//     next(error)
//   }
// }
