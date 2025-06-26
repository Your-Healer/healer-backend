import { Router } from 'express'
import {
  createNewPatientController,
  getAllExtrinsicTransactionsController,
  getAllQueriesController,
  setBalancesController,
  getPatientByIdController,
  updatePatientController,
  deletePatientController,
  getPatientIdsByPatientNameController,
  getClinicalTestsController,
  createClinicalTestController,
  updateClinicalTestController,
  deleteClinicalTestController,
  createDiseaseProgressionController,
  updateDiseaseProgressionController,
  deleteDiseaseProgressionController,
  createMedicalRecordController
} from '~/controllers/blockchain.controller'
import { protect } from '../middlewares/auth/index'

const router = Router()

router.post('/set-balances', setBalancesController)

router.get('/get-all-queries', getAllQueriesController)

router.get('/get-all-extrinsics', getAllExtrinsicTransactionsController)

router.get('/patients/:id', protect, getPatientByIdController)

router.get('/patients/', protect, getPatientIdsByPatientNameController)

router.get('/clinical-tests/', protect, getClinicalTestsController)

router.post('/patients/', protect, createNewPatientController)

router.patch('/patients/', protect, updatePatientController)

router.delete('/patients/:patientId', protect, deletePatientController)

router.post('/clinical-tests/', protect, createClinicalTestController)

router.patch('/clinical-tests/', protect, updateClinicalTestController)

router.delete('/clinical-tests/:testId', protect, deleteClinicalTestController)

router.post('/disease-progressions/', protect, createDiseaseProgressionController)

router.patch('/disease-progressions/', protect, updateDiseaseProgressionController)

router.delete('/disease-progressions/:progressionId', protect, deleteDiseaseProgressionController)

router.post('/medical-records/', protect, createMedicalRecordController)

export default router
