import { Router } from 'express'
import {
  createNewPatientController,
  getAllExtrinsicTransactionsController,
  getAllQueriesController,
  setBalancesController,
  getPatientByIdController,
  getPatientIdsByPatientName,
  updatePatientController,
  deletePatientController
} from '~/controllers/blockchain.controller'
import { protect } from '../middlewares/auth/index'

const router = Router()

router.post('/set-balances', setBalancesController)

router.get('/get-all-queries', getAllQueriesController)

router.get('/get-all-extrinsics', getAllExtrinsicTransactionsController)

router.get('/patients/:id', protect, getPatientByIdController)

router.get('/patients/', protect, getPatientIdsByPatientName)

router.post('/patients/', protect, createNewPatientController)

router.patch('/patients/', protect, updatePatientController)

router.delete('/patients/:patientId', protect, deletePatientController)

export default router
