export interface Document {
  id: number
  name: string
  type: string
  size: number
  folder_id: number | null
  created_by: string
  created_at: Date
}

export interface DocumentResponse {
  status: 'success' | 'error'
  data: Document[]
}

export interface SingleDocumentResponse {
  status: 'success' | 'error'
  data: Document
}

export interface CreateDocumentRequest {
  name: string
  type: string
  size: number
  folder_id?: number | null
  created_by: string
}
