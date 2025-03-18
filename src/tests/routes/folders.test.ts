import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import folderRoutes from '../../routes/folders'
import { db } from '../../lib/db/config'

vi.mock('../../lib/db/config', () => {
  const mockDb = {
    selectFrom: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    execute: vi.fn(),
    insertInto: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    executeTakeFirst: vi.fn(),
    deleteFrom: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  }
  return { db: mockDb }
})

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

  describe('GET /api/folders/:id', () => {
    it('should return a single folder by ID', async () => {
      const mockFolder = {
        id: 1,
        name: 'Test Folder',
        parent_id: null,
        created_by: 'user1',
        created_at: new Date(),
      }

      vi.mocked(db.selectFrom).mockReturnThis()
      vi.mocked(db.select).mockReturnThis()
      vi.mocked(db.where).mockReturnThis()
      vi.mocked(db.executeTakeFirst).mockResolvedValue(mockFolder)

      const response = await request(app).get('/api/folders/1')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.data).toMatchObject({
        id: 1,
        name: 'Test Folder',
        parent_id: null,
        created_by: 'user1',
      })
      expect(db.selectFrom).toHaveBeenCalledWith('folders')
      expect(db.select).toHaveBeenCalledWith([
        'id',
        'name',
        'parent_id',
        'created_by',
        'created_at',
      ])
      expect(db.where).toHaveBeenCalledWith('id', '=', 1)
      expect(db.executeTakeFirst).toHaveBeenCalled()
    })

    it('should return 404 if folder not found', async () => {
      vi.mocked(db.selectFrom).mockReturnThis()
      vi.mocked(db.select).mockReturnThis()
      vi.mocked(db.where).mockReturnThis()
      vi.mocked(db.executeTakeFirst).mockResolvedValue(null)

      const response = await request(app).get('/api/folders/999')

      expect(response.status).toBe(404)
      expect(response.body.status).toBe('error')
      expect(response.body.message).toBe('Folder not found')
    })
  })

  describe('PUT /api/folders/:id', () => {
    it('should update a folder', async () => {
      const folderUpdate = {
        name: 'Updated Folder',
      }

      const updatedFolder = {
        id: 1,
        name: 'Updated Folder',
        parent_id: null,
        created_by: 'user1',
        created_at: new Date(),
      }

      vi.mocked(db.update).mockReturnThis()
      vi.mocked(db.set).mockReturnThis()
      vi.mocked(db.where).mockReturnThis()
      vi.mocked(db.returning).mockReturnThis()
      vi.mocked(db.executeTakeFirst).mockResolvedValue(updatedFolder)

      const response = await request(app)
        .put('/api/folders/1')
        .send(folderUpdate)
        .set('Content-Type', 'application/json')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.data).toMatchObject({
        id: 1,
        name: 'Updated Folder',
        parent_id: null,
        created_by: 'user1',
      })
      expect(db.update).toHaveBeenCalledWith('folders')
      expect(db.set).toHaveBeenCalledWith({ name: 'Updated Folder' })
      expect(db.where).toHaveBeenCalledWith('id', '=', 1)
      expect(db.returning).toHaveBeenCalledWith([
        'id',
        'name',
        'parent_id',
        'created_by',
        'created_at',
      ])
      expect(db.executeTakeFirst).toHaveBeenCalled()
    })

    it('should return 404 if folder to update is not found', async () => {
      const folderUpdate = {
        name: 'Updated Folder',
      }

      vi.mocked(db.update).mockReturnThis()
      vi.mocked(db.set).mockReturnThis()
      vi.mocked(db.where).mockReturnThis()
      vi.mocked(db.returning).mockReturnThis()
      vi.mocked(db.executeTakeFirst).mockResolvedValue(null)

      const response = await request(app)
        .put('/api/folders/999')
        .send(folderUpdate)
        .set('Content-Type', 'application/json')

      expect(response.status).toBe(404)
      expect(response.body.status).toBe('error')
      expect(response.body.message).toBe('Folder not found')
    })
  })

  describe('DELETE /api/folders/:id', () => {
    it('should delete a folder', async () => {
      const deletedFolder = {
        id: 1,
        name: 'Deleted Folder',
        parent_id: null,
        created_by: 'user1',
        created_at: new Date(),
      }

      vi.mocked(db.deleteFrom).mockReturnThis()
      vi.mocked(db.where).mockReturnThis()
      vi.mocked(db.returning).mockReturnThis()
      vi.mocked(db.executeTakeFirst).mockResolvedValue(deletedFolder)

      const response = await request(app).delete('/api/folders/1')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('success')
      expect(response.body.data).toMatchObject({
        id: 1,
        name: 'Deleted Folder',
      })
      expect(db.deleteFrom).toHaveBeenCalledWith('folders')
      expect(db.where).toHaveBeenCalledWith('id', '=', 1)
      expect(db.returning).toHaveBeenCalledWith([
        'id',
        'name',
        'parent_id',
        'created_by',
        'created_at',
      ])
      expect(db.executeTakeFirst).toHaveBeenCalled()
    })

    it('should return 404 if folder to delete is not found', async () => {
      vi.mocked(db.deleteFrom).mockReturnThis()
      vi.mocked(db.where).mockReturnThis()
      vi.mocked(db.returning).mockReturnThis()
      vi.mocked(db.executeTakeFirst).mockResolvedValue(null)

      const response = await request(app).delete('/api/folders/999')

      expect(response.status).toBe(404)
      expect(response.body.status).toBe('error')
      expect(response.body.message).toBe('Folder not found')
    })
  })
})
