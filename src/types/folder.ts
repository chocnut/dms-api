export interface Folder {
  id: number
  name: string
  parent_id: number | null
  created_by: string
  created_at: Date
}

export interface FolderResponse {
  status: 'success' | 'error'
  data: Folder[]
}
