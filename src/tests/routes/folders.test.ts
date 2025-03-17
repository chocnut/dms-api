import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import folderRoutes from '../../routes/folders'
import { db } from '../../lib/db/config'

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

describe('Folder Routes', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/api/folders', folderRoutes)

    vi.clearAllMocks()
  })

  describe('GET /api/folders', () => {
    it('should return all folders', async () => {
      const mockFolders = [
        {
          id: 1,
          name: 'Folder 1',
          parent_id: null,
          created_by: 'user1',
          created_at: new Date(),
        },
        {
          id: 2,
          name: 'Folder 2',
          parent_id: 1,
          created_by: 'user2',
          created_at: new Date(),
        },
      ]

      vi.mocked(db.selectFrom).mockReturnThis()
      vi.mocked(db.select).mockReturnThis()
      vi.mocked(db.orderBy).mockReturnThis()
      vi.mocked(db.execute).mockResolvedValue(mockFolders)

      const response = await request(app).get('/api/folders')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.data).toHaveLength(2)
      expect(response.body.data[0]).toMatchObject({
        id: 1,
        name: 'Folder 1',
        parent_id: null,
        created_by: 'user1',
      })
      expect(response.body.data[1]).toMatchObject({
        id: 2,
        name: 'Folder 2',
        parent_id: 1,
        created_by: 'user2',
      })
      expect(db.selectFrom).toHaveBeenCalledWith('folders')
      expect(db.select).toHaveBeenCalledWith([
        'id',
        'name',
        'parent_id',
        'created_by',
        'created_at',
      ])
      expect(db.orderBy).toHaveBeenCalledWith('created_at', 'desc')
      expect(db.execute).toHaveBeenCalled()
    })

    it('should filter folders by parent_id', async () => {
      const mockFolders = [
        {
          id: 2,
          name: 'Folder 2',
          parent_id: 1,
          created_by: 'user2',
          created_at: new Date(),
        },
      ]

      vi.mocked(db.selectFrom).mockReturnThis()
      vi.mocked(db.select).mockReturnThis()
      vi.mocked(db.where).mockReturnThis()
      vi.mocked(db.orderBy).mockReturnThis()
      vi.mocked(db.execute).mockResolvedValue(mockFolders)

      const response = await request(app).get('/api/folders?parent_id=1')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0]).toMatchObject({
        id: 2,
        name: 'Folder 2',
        parent_id: 1,
        created_by: 'user2',
      })
      expect(db.selectFrom).toHaveBeenCalledWith('folders')
      expect(db.select).toHaveBeenCalledWith([
        'id',
        'name',
        'parent_id',
        'created_by',
        'created_at',
      ])
      expect(db.where).toHaveBeenCalledWith('parent_id', '=', 1)
      expect(db.orderBy).toHaveBeenCalledWith('created_at', 'desc')
      expect(db.execute).toHaveBeenCalled()
    })
  })

  describe('POST /api/folders', () => {
    it('should create a new folder', async () => {
      const newFolder = {
        name: 'New Folder',
        parent_id: null,
        created_by: 'user1',
      }

      const createdFolder = {
        id: 3,
        name: 'New Folder',
        parent_id: null,
        created_by: 'user1',
        created_at: new Date(),
      }

      vi.mocked(db.insertInto).mockReturnThis()
      vi.mocked(db.values).mockReturnThis()
      vi.mocked(db.returning).mockReturnThis()
      vi.mocked(db.executeTakeFirst).mockResolvedValue(createdFolder)

      const response = await request(app)
        .post('/api/folders')
        .send(newFolder)
        .set('Content-Type', 'application/json')

      expect(response.status).toBe(201)
      expect(response.body.status).toBe('success')
      expect(response.body.data).toMatchObject({
        id: 3,
        name: 'New Folder',
        parent_id: null,
        created_by: 'user1',
      })
      expect(db.insertInto).toHaveBeenCalledWith('folders')
      expect(db.values).toHaveBeenCalledWith({
        name: 'New Folder',
        parent_id: null,
        created_by: 'user1',
      })
      expect(db.returning).toHaveBeenCalledWith([
        'id',
        'name',
        'parent_id',
        'created_by',
        'created_at',
      ])
      expect(db.executeTakeFirst).toHaveBeenCalled()
    })
  })
})
