import { Request, Response, Router } from 'express'
import { compareHashedPassword, createHashedPassword } from '~/middlewares/auth'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  res.send('Hello World!')
})

export default router
