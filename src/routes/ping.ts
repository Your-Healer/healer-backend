import { NextFunction, Request, Response, Router } from 'express'
import { compareHashedPassword, createHashedPassword } from '~/middlewares/auth'
import multer from 'multer'
import { decode } from 'base64-arraybuffer'
import supabaseClient from '~/configs/supabase'

const router = Router()

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

router.get('/', async (req: Request, res: Response) => {
  res.send('Hello World!')
})

router.post(
  '/upload/single',
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        console.log('Multer error:', error)
        return res.status(500).send({ error: 'Multer error occurred when uploading' })
      } else if (error) {
        console.log('Error:', error)
        return res.status(500).send({ error: 'Error occurred when uploading' })
      }
      next()
    })
  },
  async (req: any, res: Response) => {
    try {
      const file = req.file
      if (!file) {
        res.status(400).json({ message: 'Please upload a file' })
        return
      }

      const fileBase64 = decode(file.buffer.toString('base64'))

      const { data, error } = await supabaseClient.storage
        .from('your-healer-bucket')
        .upload(file.originalname, fileBase64, {
          contentType: file.mimetype
        })

      if (error) {
        throw error
      }

      const { data: image } = supabaseClient.storage.from('your-healer-bucket').getPublicUrl(data.path)

      res.status(200).json({ image: image.publicUrl, message: 'File uploaded successfully' })
    } catch (error: any) {
      console.log('Error uploading file:', error)
      res.status(500).json({ error: 'Error uploading file', details: error.message })
    }
  }
)

router.post(
  '/upload/multiple',
  (req: Request, res: Response, next: NextFunction) => {
    upload.array('files', 10)(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        return res.status(500).send({ error: 'Multer error occurred when uploading' })
      } else if (error) {
        return res.status(500).send({ error: 'Error occurred when uploading' })
      }
      next()
    })
  },
  (req: any, res: Response) => {
    console.log(req.files, req.body)

    res.send('Files uploaded successfully')
  }
)

export default router
