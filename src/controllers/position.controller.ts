import { Request, Response, NextFunction } from 'express'
import PositionService from '~/services/position.service'

const positionService = PositionService.getInstance()

export async function getPositionsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { positionId, page = 1, limit = 10 } = req.query

    const data = {
      positionId: typeof positionId === 'string' ? positionId : undefined,
      page: Number(page),
      limit: Number(limit)
    }

    const result = await positionService.getPositions(data)

    return res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching positions:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
