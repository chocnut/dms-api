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
    insertInto: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    executeTakeFirst: vi.fn(),
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

  describe('POST /api/documents', () => {
    it('should create a new document', async () => {
      const newDocument = {
        name: 'New Document.pdf',
        type: 'pdf',
        size: 1024,
        folder_id: null,
        created_by: 'user1',
      }

      const createdDocument = {
        id: 3,
        name: 'New Document.pdf',
        type: 'pdf',
        size: 1024,
        folder_id: null,
        created_by: 'user1',
        created_at: new Date(),
      }

      vi.mocked(db.insertInto).mockReturnThis()
      vi.mocked(db.values).mockReturnThis()
      vi.mocked(db.returning).mockReturnThis()
      vi.mocked(db.executeTakeFirst).mockResolvedValue(createdDocument)

      const response = await request(app)
        .post('/api/documents')
        .send(newDocument)
        .set('Content-Type', 'application/json')

      expect(response.status).toBe(201)
      expect(response.body.status).toBe('success')
      expect(response.body.data).toMatchObject({
        id: 3,
        name: 'New Document.pdf',
        type: 'pdf',
        size: 1024,
        folder_id: null,
        created_by: 'user1',
      })
      expect(db.insertInto).toHaveBeenCalledWith('documents')
      expect(db.values).toHaveBeenCalledWith({
        name: 'New Document.pdf',
        type: 'pdf',
        size: 1024,
        folder_id: null,
        created_by: 'user1',
      })
      expect(db.returning).toHaveBeenCalledWith([
        'id',
        'name',
        'type',
        'size',
        'folder_id',
        'created_by',
        'created_at',
      ])
      expect(db.executeTakeFirst).toHaveBeenCalled()
    })

    it('should handle document creation failure', async () => {
      const newDocument = {
        name: 'Failed Document.pdf',
        type: 'pdf',
        size: 1024,
        folder_id: null,
        created_by: 'user1',
      }

      vi.mocked(db.insertInto).mockReturnThis()
      vi.mocked(db.values).mockReturnThis()
      vi.mocked(db.returning).mockReturnThis()
      vi.mocked(db.executeTakeFirst).mockResolvedValue(null)

      const response = await request(app)
        .post('/api/documents')
        .send(newDocument)
        .set('Content-Type', 'application/json')

      expect(response.status).toBe(400)
      expect(response.body.status).toBe('error')
      expect(response.body.message).toBe('Failed to create document')
      expect(db.insertInto).toHaveBeenCalledWith('documents')
      expect(db.values).toHaveBeenCalledWith({
        name: 'Failed Document.pdf',
        type: 'pdf',
        size: 1024,
        folder_id: null,
        created_by: 'user1',
      })
      expect(db.returning).toHaveBeenCalledWith([
        'id',
        'name',
        'type',
        'size',
        'folder_id',
        'created_by',
        'created_at',
      ])
      expect(db.executeTakeFirst).toHaveBeenCalled()
    })
  })
})
