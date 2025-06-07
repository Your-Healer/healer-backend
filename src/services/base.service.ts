export default abstract class BaseService {
  protected handleError(error: any, operation: string): never {
    console.error(`Error in ${operation}:`, error)
    throw error
  }

  protected calculatePagination(page: number, limit: number) {
    const skip = (page - 1) * limit
    const take = limit
    return { skip, take }
  }

  protected formatPaginationResult<T>(data: T[], total: number, page: number, limit: number) {
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}
