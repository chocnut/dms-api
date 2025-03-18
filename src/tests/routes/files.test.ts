import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import fileRoutes from '../../routes/files'
import { db } from '../../lib/db/config'

vi.mock('../../lib/db/config', () => {
  const mockDb = {
    selectFrom: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    execute: vi.fn(),
    executeTakeFirst: vi.fn(),
  }
  return { db: mockDb }
})

vi.mock('kysely', () => ({
  sql: vi.fn().mockImplementation((_strings, ..._values) => ({
    as: vi.fn().mockReturnThis(),
  })),
}))

describe('File Routes', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/api/files', fileRoutes)

    vi.clearAllMocks()
  })

  describe('GET /api/files', () => {
    it('should return combined folders and documents with pagination', async () => {
      const mockFolders = [
        {
          id: 1,
          name: 'Folder 1',
          type: 'folder',
          size: 0,
          parent_id: null,
          created_by: 'user1',
          created_at: new Date(),
        },
      ]

      const mockDocuments = [
        {
          id: 2,
          name: 'Document 1',
          type: 'pdf',
          size: 1024,
          parent_id: null,
          created_by: 'user1',
          created_at: new Date(),
        },
      ]

      vi.mocked(db.selectFrom).mockReturnThis()
      vi.mocked(db.select).mockReturnThis()
      vi.mocked(db.where).mockReturnThis()
      vi.mocked(db.orderBy).mockReturnThis()
      vi.mocked(db.execute).mockResolvedValueOnce(mockFolders).mockResolvedValueOnce(mockDocuments)

      const response = await request(app).get('/api/files')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.data).toHaveLength(2)
      expect(response.body.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      })

      expect(db.selectFrom).toHaveBeenCalledWith('folders')
      expect(db.selectFrom).toHaveBeenCalledWith('documents')
    })

    it('should filter by folder_id when provided', async () => {
      const mockFolders = [
        {
          id: 3,
          name: 'Subfolder',
          type: 'folder',
          size: 0,
          parent_id: 1,
          created_by: 'user1',
          created_at: new Date(),
        },
      ]

      const mockDocuments = [
        {
          id: 4,
          name: 'Document in folder',
          type: 'pdf',
          size: 2048,
          parent_id: 1,
          created_by: 'user1',
          created_at: new Date(),
        },
      ]

      vi.mocked(db.selectFrom).mockReturnThis()
      vi.mocked(db.select).mockReturnThis()
      vi.mocked(db.where).mockReturnThis()
      vi.mocked(db.orderBy).mockReturnThis()
      vi.mocked(db.execute).mockResolvedValueOnce(mockFolders).mockResolvedValueOnce(mockDocuments)

      const response = await request(app).get('/api/files?parent_id=1')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.data).toHaveLength(2)

      expect(db.where).toHaveBeenCalledWith('parent_id', '=', 1)
      expect(db.where).toHaveBeenCalledWith('folder_id', '=', 1)
    })

    it('should apply pagination parameters', async () => {
      const mockFolders = Array(10)
        .fill(null)
        .map((_, i) => ({
          id: i + 1,
          name: `Folder ${i + 1}`,
          type: 'folder',
          size: 0,
          parent_id: null,
          created_by: 'user1',
          created_at: new Date(),
        }))

      const mockDocuments = Array(10)
        .fill(null)
        .map((_, i) => ({
          id: i + 11,
          name: `Document ${i + 1}`,
          type: 'pdf',
          size: 1024 * (i + 1),
          parent_id: null,
          created_by: 'user1',
          created_at: new Date(),
        }))

      vi.mocked(db.selectFrom).mockReturnThis()
      vi.mocked(db.select).mockReturnThis()
      vi.mocked(db.where).mockReturnThis()
      vi.mocked(db.orderBy).mockReturnThis()
      vi.mocked(db.execute).mockResolvedValueOnce(mockFolders).mockResolvedValueOnce(mockDocuments)

      const response = await request(app).get('/api/files?page=2&limit=5')

      expect(response.status).toBe(200)
      expect(response.body.pagination).toEqual({
        total: 20,
        page: 2,
        limit: 5,
        totalPages: 4,
      })
    })

    it('should apply search functionality', async () => {
      const mockFolders = [
        {
          id: 1,
          name: 'Test Folder',
          type: 'folder',
          size: 0,
          parent_id: null,
          created_by: 'user1',
          created_at: new Date(),
        },
      ]

      const mockDocuments = [
        {
          id: 2,
          name: 'Test Document',
          type: 'pdf',
          size: 1024,
          parent_id: null,
          created_by: 'user1',
          created_at: new Date(),
        },
      ]

      vi.mocked(db.selectFrom).mockReturnThis()
      vi.mocked(db.select).mockReturnThis()
      vi.mocked(db.where).mockReturnThis()
      vi.mocked(db.orderBy).mockReturnThis()
      vi.mocked(db.execute).mockResolvedValueOnce(mockFolders).mockResolvedValueOnce(mockDocuments)

      const response = await request(app).get('/api/files?search=Test')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.data).toHaveLength(2)

      expect(db.where).toHaveBeenCalledWith('name', 'like', '%Test%')
    })
  })
})
