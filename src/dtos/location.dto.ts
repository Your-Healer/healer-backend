export interface Pagination {
  page: number
  limit: number
}

export interface GetLocationRequest extends Pagination {
  name?: string
  location?: string
}
