import { Request, Response, Router } from 'express'
import { compareHashedPassword, createHashedPassword } from '~/middlewares/auth'
import multer from 'multer'

const upload = multer({ dest: 'uploads/' })
const router = Router()

router.get('/', async (req: Request, res: Response) => {
  res.send('Hello World!')
})

router.post('/upload/single', upload.single('file'), (req: any, res: Response) => {
  console.log(req.file, req.body)
})

router.post('/upload/multiple', upload.array('files', 10), (req: any, res: Response) => {
  console.log(req.files, req.body)
  res.send('Files uploaded successfully')
})

export default router
