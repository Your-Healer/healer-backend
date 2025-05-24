import { SupabaseClient } from '@supabase/supabase-js'
import supabaseClient from '~/configs/supabase'
export default class SupabaseService {
  private static instance: SupabaseService
  private supbaseClient: SupabaseClient

  private constructor() {
    this.supbaseClient = supabaseClient
  }

  static getInstance() {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService()
    }
    return SupabaseService.instance
  }

  getClient(): SupabaseClient {
    return this.supbaseClient
  }

  async createBulket({
    name,
    options
  }: {
    name: string
    options?: {
      public: boolean
      fileSizeLimit?: number | string | null
      allowedMimeTypes?: string[] | null
    }
  }): Promise<any> {
    const { data, error } = await this.supbaseClient.storage.createBucket(name, options)

    if (error) {
      throw new Error(`Failed to create bucket: ${error.message}`)
    }

    return data
  }

  async uploadingFileStandard({
    bucketName,
    filePath,
    fileBody
  }: {
    bucketName: string
    filePath: string
    fileBody: any
  }): Promise<any> {
    const { data, error } = await this.supbaseClient.storage.from(bucketName).upload(filePath, fileBody)
    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`)
    }

    return data
  }
}
