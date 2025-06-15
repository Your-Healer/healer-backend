import { NextFunction, Request, Response } from 'express'
import LocationService from '~/services/location.service'

const locationService = LocationService.getInstance()

export async function getLocationsController(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const { page, limit, name, location } = req.query
    const data = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      name: typeof name === 'string' ? name : undefined,
      location: typeof location === 'string' ? location : undefined
    }

    const result = await locationService.getLocations(data)
    res.status(200).json(result)
  } catch (error: any) {
    console.error('Error fetching locations:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
