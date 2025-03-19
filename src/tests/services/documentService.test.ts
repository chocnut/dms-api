import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDocumentService } from '../../services/documentService'
import { Document, CreateDocumentDTO } from '../../repositories/documentRepository'
import { Kysely } from 'kysely'
import { Database } from '../../lib/db/schema'

const mockRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}

vi.mock('../../repositories/documentRepository', () => ({
  createDocumentRepository: () => mockRepository,
}))

describe('DocumentService', () => {
  const mockDb = {} as Kysely<Database>
  const mockDocument: Document = {
    id: 1,
    name: 'test.pdf',
    type: 'application/pdf',
    size: 1024,
    folder_id: null,
    created_by: 'test-user',
    created_at: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const documentService = createDocumentService(mockDb)

  describe('getAllDocuments', () => {
    it('should return all documents', async () => {
      const mockDocuments = [mockDocument]
      mockRepository.findAll.mockResolvedValue(mockDocuments)

      const result = await documentService.getAllDocuments()

      expect(result).toEqual(mockDocuments)
      expect(mockRepository.findAll).toHaveBeenCalledWith(undefined)
    })

    it('should filter documents by folder_id', async () => {
      const folderId = 1
      const mockDocuments = [mockDocument]
      mockRepository.findAll.mockResolvedValue(mockDocuments)

      await documentService.getAllDocuments(folderId)

      expect(mockRepository.findAll).toHaveBeenCalledWith(folderId)
    })
  })

  describe('getDocumentById', () => {
    it('should return a document by id', async () => {
      mockRepository.findById.mockResolvedValue(mockDocument)

      const result = await documentService.getDocumentById(1)

      expect(result).toEqual(mockDocument)
      expect(mockRepository.findById).toHaveBeenCalledWith(1)
    })

    it('should return null for non-existent document', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const result = await documentService.getDocumentById(999)

      expect(result).toBeNull()
      expect(mockRepository.findById).toHaveBeenCalledWith(999)
    })
  })

  describe('createDocument', () => {
    it('should create a new document', async () => {
      const createDTO: CreateDocumentDTO = {
        name: 'new.pdf',
        type: 'application/pdf',
        size: 1024,
        folder_id: null,
        created_by: 'test-user',
      }
      mockRepository.create.mockResolvedValue({ ...createDTO, id: 1, created_at: new Date() })

      const result = await documentService.createDocument(createDTO)

      expect(result).toMatchObject({
        ...createDTO,
        id: expect.any(Number),
        created_at: expect.any(Date),
      })
      expect(mockRepository.create).toHaveBeenCalledWith(createDTO)
    })
  })

  describe('updateDocument', () => {
    it('should update an existing document', async () => {
      const updateData = {
        name: 'updated.pdf',
        folder_id: 1,
      }
      mockRepository.findById.mockResolvedValue(mockDocument)
      mockRepository.update.mockResolvedValue({ ...mockDocument, ...updateData })

      const result = await documentService.updateDocument(1, updateData)

      expect(result).toMatchObject({
        ...mockDocument,
        ...updateData,
      })
      expect(mockRepository.findById).toHaveBeenCalledWith(1)
      expect(mockRepository.update).toHaveBeenCalledWith(1, updateData)
    })

    it('should return null when updating non-existent document', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const result = await documentService.updateDocument(999, { name: 'test.pdf' })

      expect(result).toBeNull()
      expect(mockRepository.findById).toHaveBeenCalledWith(999)
      expect(mockRepository.update).not.toHaveBeenCalled()
    })
  })

  describe('deleteDocument', () => {
    it('should delete an existing document', async () => {
      mockRepository.remove.mockResolvedValue(mockDocument)

      const result = await documentService.deleteDocument(1)

      expect(result).toEqual(mockDocument)
      expect(mockRepository.remove).toHaveBeenCalledWith(1)
    })

    it('should return null when deleting non-existent document', async () => {
      mockRepository.remove.mockResolvedValue(null)

      const result = await documentService.deleteDocument(999)

      expect(result).toBeNull()
      expect(mockRepository.remove).toHaveBeenCalledWith(999)
    })
  })
})
