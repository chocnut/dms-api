export type FileType = 'document' | 'folder'

export interface File {
  id: number
  name: string
  type: FileType
  size?: number
  folder_id: number | null
  created_by: string
  created_at: Date
  parent_id?: number | null
}

export interface FileResponse {
  status: 'success' | 'error'
  data: File[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
