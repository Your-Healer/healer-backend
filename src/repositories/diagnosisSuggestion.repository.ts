import { PrismaClient, DiagnosisSuggestion } from '@prisma/client'
import { injectable } from 'inversify'
import prisma from '~/libs/prisma/init'

@injectable()
export default class DiagnosisSuggestionRepository {
  private readonly _prisma: PrismaClient
  constructor() {
    this._prisma = prisma
  }

  async save(diagnosisSuggestion: DiagnosisSuggestion): Promise<DiagnosisSuggestion> {
    return await this._prisma.diagnosisSuggestion.create({
      data: diagnosisSuggestion
    })
  }
}
