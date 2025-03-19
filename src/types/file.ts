export type FileType = 'folder' | 'document'

export interface File {
  id: number
  name: string
  type: FileType
  size?: number
  folder_id: number | null
  created_by: string
  created_at: Date
}

export interface FileResponse {
  status: 'success' | 'error'
  data: File[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
