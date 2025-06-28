// import { CreateDiagnosisSuggestionRequest, DiagnosisSuggestionFilter } from '~/utils/types'
// import BaseService from './base.service'
// import prisma from '~/libs/prisma/init'
// import { Prisma } from '@prisma/client'

// export default class DiagnosisSuggestionService extends BaseService {
//   private static instance: DiagnosisSuggestionService
//   private constructor() {
//     super()
//   }

//   static getInstance(): DiagnosisSuggestionService {
//     if (!DiagnosisSuggestionService.instance) {
//       DiagnosisSuggestionService.instance = new DiagnosisSuggestionService()
//     }
//     return DiagnosisSuggestionService.instance
//   }

//   async getDiagnosisSuggestions(page: number = 1, limit: number = 10, filter: DiagnosisSuggestionFilter) {
//     try {
//       const { skip, take } = this.calculatePagination(page, limit)

//       const where: any = {}

//       if (filter.appointmentId) {
//         where.appointmentId = filter.appointmentId
//       }

//       if (filter.id) {
//         where.id = filter.id
//       }

//       const [diagnosisSuggestions, total] = await Promise.all([
//         prisma.diagnosisSuggestion.findMany({
//           orderBy: {
//             createdAt: 'desc'
//           },
//           take,
//           where,
//           include: {
//             appointment: true
//           }
//         }),
//         prisma.diagnosisSuggestion.count({ where })
//       ])
//       return this.formatPaginationResult(diagnosisSuggestions, total, page, limit)
//     } catch (error) {
//       this.handleError(error, 'getDiagnosisSuggestions')
//     }
//   }

//   async createDiagnosisSuggestion(data: CreateDiagnosisSuggestionRequest) {
//     try {
//       const { appointmentId, suggestedByAI, disease, confidence, description } = data

//       const existingAppointment = await prisma.appointment.findUnique({
//         where: { id: appointmentId }
//       })

//       if (!existingAppointment) {
//         throw new Error('Appointment not found')
//       }

//       const diagnosisData: Prisma.DiagnosisSuggestionCreateInput = {
//               appointment: { connect: { id: data.appointmentId } },
//               suggestedByAI: data.suggestedByAI ? 'TRUE' : 'FALSE',
//               disease: data.disease,
//               confidence: data.confidence,
//               description: data.description
//             }
//       const diagnosisSuggestion = await prisma.diagnosisSuggestion.create({
//         data: {
//           appointment: {
//             connect: { id: appointmentId }
//           },
//           confidence,
//           disease,
//           description,
//           suggestedByAI,

//         }
//       })
//     } catch (error) {}
//   }
// }
