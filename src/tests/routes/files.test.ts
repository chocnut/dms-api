import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import fileRoutes from '../../routes/files'
import { db } from '../../lib/db/config'

vi.mock('../../lib/db/config', () => ({
  db: {
    selectFrom: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    union: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    execute: vi.fn(),
    executeTakeFirst: vi.fn(),
  },
}))

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
      const mockFiles = [
        {
          id: 1,
          name: 'Folder 1',
          type: 'folder',
          size: null,
          folder_id: null,
          created_by: 'user1',
          created_at: new Date(),
        },
        {
          id: 1,
          name: 'Document 1',
          type: 'document',
          size: 1024,
          folder_id: null,
          created_by: 'user1',
          created_at: new Date(),
        },
      ]

      const mockFolderCount = { count: 1 }
      const mockDocumentCount = { count: 1 }

      vi.mocked(db.selectFrom).mockReturnThis()
      vi.mocked(db.select).mockReturnThis()
      vi.mocked(db.where).mockReturnThis()
      vi.mocked(db.union).mockReturnThis()
      vi.mocked(db.orderBy).mockReturnThis()
      vi.mocked(db.limit).mockReturnThis()
      vi.mocked(db.offset).mockReturnThis()
      vi.mocked(db.execute).mockResolvedValue(mockFiles)
      vi.mocked(db.executeTakeFirst)
        .mockResolvedValueOnce(mockFolderCount)
        .mockResolvedValueOnce(mockDocumentCount)

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
      expect(db.where).toHaveBeenCalledWith('parent_id', 'is', null)
      expect(db.where).toHaveBeenCalledWith('folder_id', 'is', null)
      expect(db.union).toHaveBeenCalled()
      expect(db.orderBy).toHaveBeenCalledWith('name', 'asc')
      expect(db.orderBy).toHaveBeenCalledWith('type', 'asc')
      expect(db.limit).toHaveBeenCalledWith(10)
      expect(db.offset).toHaveBeenCalledWith(0)
    })

    it('should filter by folder_id when provided', async () => {
      const mockFiles = [
        {
          id: 2,
          name: 'Subfolder',
          type: 'folder',
          size: null,
          folder_id: 1,
          created_by: 'user1',
          created_at: new Date(),
        },
        {
          id: 2,
          name: 'Document in folder',
          type: 'document',
          size: 2048,
          folder_id: 1,
          created_by: 'user1',
          created_at: new Date(),
        },
      ]

      const mockFolderCount = { count: 1 }
      const mockDocumentCount = { count: 1 }

      vi.mocked(db.selectFrom).mockReturnThis()
      vi.mocked(db.select).mockReturnThis()
      vi.mocked(db.where).mockReturnThis()
      vi.mocked(db.union).mockReturnThis()
      vi.mocked(db.orderBy).mockReturnThis()
      vi.mocked(db.limit).mockReturnThis()
      vi.mocked(db.offset).mockReturnThis()
      vi.mocked(db.execute).mockResolvedValue(mockFiles)
      vi.mocked(db.executeTakeFirst)
        .mockResolvedValueOnce(mockFolderCount)
        .mockResolvedValueOnce(mockDocumentCount)

      const response = await request(app).get('/api/files?folder_id=1')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.data).toHaveLength(2)

      expect(db.where).toHaveBeenCalledWith('parent_id', '=', 1)
      expect(db.where).toHaveBeenCalledWith('folder_id', '=', 1)
    })

    it('should apply pagination parameters', async () => {
      const mockFiles = [
        {
          id: 1,
          name: 'Folder 1',
          type: 'folder',
          size: null,
          folder_id: null,
          created_by: 'user1',
          created_at: new Date(),
        },
      ]

      const mockFolderCount = { count: 10 }
      const mockDocumentCount = { count: 10 }

      vi.mocked(db.selectFrom).mockReturnThis()
      vi.mocked(db.select).mockReturnThis()
      vi.mocked(db.where).mockReturnThis()
      vi.mocked(db.union).mockReturnThis()
      vi.mocked(db.orderBy).mockReturnThis()
      vi.mocked(db.limit).mockReturnThis()
      vi.mocked(db.offset).mockReturnThis()
      vi.mocked(db.execute).mockResolvedValue(mockFiles)
      vi.mocked(db.executeTakeFirst)
        .mockResolvedValueOnce(mockFolderCount)
        .mockResolvedValueOnce(mockDocumentCount)

      const response = await request(app).get('/api/files?page=2&limit=5')

      expect(response.status).toBe(200)
      expect(response.body.pagination).toEqual({
        total: 20,
        page: 2,
        limit: 5,
        totalPages: 4,
      })

      expect(db.limit).toHaveBeenCalledWith(5)
      expect(db.offset).toHaveBeenCalledWith(5)
    })

    it('should apply sorting parameters', async () => {
      const mockFiles = [
        {
          id: 1,
          name: 'Folder 1',
          type: 'folder',
          size: null,
          folder_id: null,
          created_by: 'user1',
          created_at: new Date(),
        },
      ]

      const mockFolderCount = { count: 1 }
      const mockDocumentCount = { count: 1 }

      vi.mocked(db.selectFrom).mockReturnThis()
      vi.mocked(db.select).mockReturnThis()
      vi.mocked(db.where).mockReturnThis()
      vi.mocked(db.union).mockReturnThis()
      vi.mocked(db.orderBy).mockReturnThis()
      vi.mocked(db.limit).mockReturnThis()
      vi.mocked(db.offset).mockReturnThis()
      vi.mocked(db.execute).mockResolvedValue(mockFiles)
      vi.mocked(db.executeTakeFirst)
        .mockResolvedValueOnce(mockFolderCount)
        .mockResolvedValueOnce(mockDocumentCount)

      const response = await request(app).get('/api/files?sort=created_at&order=desc')

      expect(response.status).toBe(200)

      expect(db.orderBy).toHaveBeenCalledWith('created_at', 'desc')
      expect(db.orderBy).toHaveBeenCalledWith('type', 'asc')
    })
  })
})
