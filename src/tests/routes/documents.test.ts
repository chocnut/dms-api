import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import documentRoutes from '../../routes/documents'
import { db } from '../../lib/db/config'

// Mock the database
vi.mock('../../lib/db/config', () => ({
  db: {
    selectFrom: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    execute: vi.fn(),
  },
}))

describe('Document Routes', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/api/documents', documentRoutes)

    // Reset mocks
    vi.clearAllMocks()
  })

  describe('GET /api/documents', () => {
    it('should return all documents', async () => {
      const mockDocuments = [
        {
          id: 1,
          name: 'Document 1',
          type: 'pdf',
          size: 1024,
          folder_id: null,
          created_by: 'user1',
          created_at: new Date(),
        },
        {
          id: 2,
          name: 'Document 2',
          type: 'docx',
          size: 2048,
          folder_id: 1,
          created_by: 'user2',
          created_at: new Date(),
        },
      ]

      // Mock the database response
      vi.mocked(db.selectFrom).mockReturnThis()
      vi.mocked(db.select).mockReturnThis()
      vi.mocked(db.orderBy).mockReturnThis()
      vi.mocked(db.execute).mockResolvedValue(mockDocuments)

      const response = await request(app).get('/api/documents')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.data).toHaveLength(2)
      expect(response.body.data[0]).toMatchObject({
        id: 1,
        name: 'Document 1',
        type: 'pdf',
        size: 1024,
        folder_id: null,
        created_by: 'user1',
      })
      expect(response.body.data[1]).toMatchObject({
        id: 2,
        name: 'Document 2',
        type: 'docx',
        size: 2048,
        folder_id: 1,
        created_by: 'user2',
      })
      expect(db.selectFrom).toHaveBeenCalledWith('documents')
      expect(db.select).toHaveBeenCalledWith([
        'id',
        'name',
        'type',
        'size',
        'folder_id',
        'created_by',
        'created_at',
      ])
      expect(db.orderBy).toHaveBeenCalledWith('created_at', 'desc')
      expect(db.execute).toHaveBeenCalled()
    })

    it('should filter documents by folder_id', async () => {
      const mockDocuments = [
        {
          id: 2,
          name: 'Document 2',
          type: 'docx',
          size: 2048,
          folder_id: 1,
          created_by: 'user2',
          created_at: new Date(),
        },
      ]

      // Mock the database response
      vi.mocked(db.selectFrom).mockReturnThis()
      vi.mocked(db.select).mockReturnThis()
      vi.mocked(db.where).mockReturnThis()
      vi.mocked(db.orderBy).mockReturnThis()
      vi.mocked(db.execute).mockResolvedValue(mockDocuments)

      const response = await request(app).get('/api/documents?folder_id=1')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0]).toMatchObject({
        id: 2,
        name: 'Document 2',
        type: 'docx',
        size: 2048,
        folder_id: 1,
        created_by: 'user2',
      })
      expect(db.selectFrom).toHaveBeenCalledWith('documents')
      expect(db.select).toHaveBeenCalledWith([
        'id',
        'name',
        'type',
        'size',
        'folder_id',
        'created_by',
        'created_at',
      ])
      expect(db.where).toHaveBeenCalledWith('folder_id', '=', 1)
      expect(db.orderBy).toHaveBeenCalledWith('created_at', 'desc')
      expect(db.execute).toHaveBeenCalled()
    })
  })
})
