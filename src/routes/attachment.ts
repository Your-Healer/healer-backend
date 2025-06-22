import express from 'express'
import multer from 'multer'
import { protect } from '../middlewares/auth/index'
import {
  getAttachmentsController,
  uploadMultipleFilesController,
  uploadSingleFileController
} from '~/controllers/attachment.controller'

const router = express.Router()
const storage = multer.memoryStorage()
const upload = multer({ storage })

router.post('/upload', upload.single('file'), uploadSingleFileController)

router.post('/uploads', upload.array('files', 10), uploadMultipleFilesController)

router.get('/', protect, getAttachmentsController)

export default router
