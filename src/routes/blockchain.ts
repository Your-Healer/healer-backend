import { Router } from 'express'
import {
  createNewPatientController,
  getAllExtrinsicTransactionsController,
  getAllQueriesController,
  setBalancesController,
  getPatientByIdController,
  getPatientIdsByPatientName
} from '~/controllers/blockchain.controller'
import { protect } from '../middlewares/auth/index'

const router = Router()

router.post('/set-balances', setBalancesController)

router.get('/get-all-queries', getAllQueriesController)

router.get('/get-all-extrinsics', getAllExtrinsicTransactionsController)

router.get('/patients/:id', protect, getPatientByIdController)

router.get('/patients/', protect, getPatientIdsByPatientName)

router.post('/patients/', protect, createNewPatientController)

export default router
