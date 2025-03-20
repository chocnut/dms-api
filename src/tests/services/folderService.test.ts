import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createFolderService, resetFolderService } from '../../services/folderService'
import { Folder, CreateFolderDTO } from '../../repositories/folderRepository'
import { Kysely } from 'kysely'
import { Database } from '../../lib/db/schema'

const mockRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}

vi.mock('../../repositories/folderRepository', () => ({
  createFolderRepository: () => mockRepository,
}))

describe('FolderService', () => {
  const mockDb = {} as Kysely<Database>
  const mockFolder: Folder = {
    id: 1,
    name: 'Test Folder',
    parent_id: null,
    created_by: 'test-user',
    created_at: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    resetFolderService()
  })

  const folderService = createFolderService(mockDb)

  describe('getAllFolders', () => {
    it('should return all folders', async () => {
      const mockFolders = [mockFolder]
      mockRepository.findAll.mockResolvedValue(mockFolders)

      const result = await folderService.getAllFolders()

      expect(result).toEqual(mockFolders)
      expect(mockRepository.findAll).toHaveBeenCalledWith(undefined)
    })

    it('should filter folders by parent_id', async () => {
      const parentId = 1
      const mockFolders = [mockFolder]
      mockRepository.findAll.mockResolvedValue(mockFolders)

      await folderService.getAllFolders(parentId)

      expect(mockRepository.findAll).toHaveBeenCalledWith(parentId)
    })
  })

  describe('getFolderById', () => {
    it('should return a folder by id', async () => {
      mockRepository.findById.mockResolvedValue(mockFolder)

      const result = await folderService.getFolderById(1)

      expect(result).toEqual(mockFolder)
      expect(mockRepository.findById).toHaveBeenCalledWith(1)
    })

    it('should return null for non-existent folder', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const result = await folderService.getFolderById(999)

      expect(result).toBeNull()
      expect(mockRepository.findById).toHaveBeenCalledWith(999)
    })
  })

  describe('createFolder', () => {
    it('should create a new folder', async () => {
      const createDTO: CreateFolderDTO = {
        name: 'New Folder',
        parent_id: null,
        created_by: 'test-user',
      }
      mockRepository.create.mockResolvedValue({ ...createDTO, id: 1, created_at: new Date() })

      const result = await folderService.createFolder(createDTO)

      expect(result).toMatchObject({
        ...createDTO,
        id: expect.any(Number),
        created_at: expect.any(Date),
      })
      expect(mockRepository.create).toHaveBeenCalledWith(createDTO)
    })

    it('should validate parent folder exists', async () => {
      const createDTO: CreateFolderDTO = {
        name: 'New Folder',
        parent_id: 999,
        created_by: 'test-user',
      }
      mockRepository.findById.mockResolvedValue(null)

      const result = await folderService.createFolder(createDTO)

      expect(result).toBeNull()
      expect(mockRepository.findById).toHaveBeenCalledWith(999)
      expect(mockRepository.create).not.toHaveBeenCalled()
    })
  })

  describe('updateFolder', () => {
    it('should update an existing folder', async () => {
      const updateData = {
        name: 'Updated Folder',
        parent_id: 2,
      }
      mockRepository.findById
        .mockResolvedValueOnce(mockFolder)
        .mockResolvedValueOnce({ id: 2, name: 'Parent Folder' })
      mockRepository.update.mockResolvedValue({ ...mockFolder, ...updateData })

      const result = await folderService.updateFolder(1, updateData)

      expect(result).toMatchObject({
        ...mockFolder,
        ...updateData,
      })
      expect(mockRepository.update).toHaveBeenCalledWith(1, updateData)
    })
  })

  describe('deleteFolder', () => {
    it('should delete an existing folder', async () => {
      mockRepository.remove.mockResolvedValue(mockFolder)

      const result = await folderService.deleteFolder(1)

      expect(result).toEqual(mockFolder)
      expect(mockRepository.remove).toHaveBeenCalledWith(1)
    })

    it('should return null when deleting non-existent folder', async () => {
      mockRepository.remove.mockResolvedValue(null)

      const result = await folderService.deleteFolder(999)

      expect(result).toBeNull()
      expect(mockRepository.remove).toHaveBeenCalledWith(999)
    })
  })
})
