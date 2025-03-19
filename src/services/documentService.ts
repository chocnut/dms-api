import { Kysely } from 'kysely'
import { Database } from '../lib/db/schema'
import {
  createDocumentRepository,
  CreateDocumentDTO,
  Document,
} from '../repositories/documentRepository'

export interface DocumentService {
  getAllDocuments: (folderId?: number | null) => Promise<Document[]>
  getDocumentById: (id: number) => Promise<Document | null>
  createDocument: (data: CreateDocumentDTO) => Promise<Document | null>
  updateDocument: (id: number, data: Partial<CreateDocumentDTO>) => Promise<Document | null>
  deleteDocument: (id: number) => Promise<Document | null>
}

let documentServiceInstance: DocumentService | null = null

export const createDocumentService = (db: Kysely<Database>): DocumentService => {
  if (documentServiceInstance) {
    return documentServiceInstance
  }

  const documentRepository = createDocumentRepository(db)

  documentServiceInstance = {
    async getAllDocuments(folderId?: number | null) {
      return await documentRepository.findAll(folderId)
    },

    async getDocumentById(id: number) {
      return await documentRepository.findById(id)
    },

    async createDocument(data: CreateDocumentDTO) {
      return await documentRepository.create(data)
    },

    async updateDocument(id: number, data: Partial<CreateDocumentDTO>) {
      const existingDocument = await documentRepository.findById(id)
      if (!existingDocument) return null

      return await documentRepository.update(id, data)
    },

    async deleteDocument(id: number) {
      return await documentRepository.remove(id)
    },
  }

  return documentServiceInstance
}

// For testing purposes
export const resetDocumentService = () => {
  documentServiceInstance = null
}

export default createDocumentService
