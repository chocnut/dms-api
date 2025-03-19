import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createFileService } from '../../services/fileService'
import { File, CreateFileDTO } from '../../repositories/fileRepository'
import { Kysely } from 'kysely'
import { Database } from '../../lib/db/schema'

const mockFileRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  findByIds: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  bulkRemove: vi.fn(),
  moveToFolder: vi.fn(),
  countByType: vi.fn(),
  getTotalSize: vi.fn(),
}

const mockFolderRepository = {
  findById: vi.fn(),
}

vi.mock('../../repositories/fileRepository', () => ({
  createFileRepository: () => mockFileRepository,
}))

vi.mock('../../repositories/folderRepository', () => ({
  createFolderRepository: () => mockFolderRepository,
}))

describe('FileService', () => {
  const mockDb = {} as Kysely<Database>
  const mockFile: File = {
    id: 1,
    name: 'test.txt',
    type: 'text/plain',
    size: 1024,
    folder_id: null,
    created_by: 'test-user',
    created_at: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const fileService = createFileService(mockDb)

  describe('getAllFiles', () => {
    it('should return all files with filters', async () => {
      const filters = { type: 'text/plain', folder_id: 1 }
      mockFileRepository.findAll.mockResolvedValue([mockFile])

      const result = await fileService.getAllFiles(filters)

      expect(result).toEqual([mockFile])
      expect(mockFileRepository.findAll).toHaveBeenCalledWith(filters)
    })
  })

  describe('getFileById', () => {
    it('should return a file by id', async () => {
      mockFileRepository.findById.mockResolvedValue(mockFile)

      const result = await fileService.getFileById(1)

      expect(result).toEqual(mockFile)
      expect(mockFileRepository.findById).toHaveBeenCalledWith(1)
    })

    it('should return null for non-existent file', async () => {
      mockFileRepository.findById.mockResolvedValue(null)

      const result = await fileService.getFileById(999)

      expect(result).toBeNull()
      expect(mockFileRepository.findById).toHaveBeenCalledWith(999)
    })
  })

  describe('createFile', () => {
    it('should create a new file', async () => {
      const createDTO: CreateFileDTO = {
        name: 'new.txt',
        type: 'text/plain',
        size: 1024,
        folder_id: null,
        created_by: 'test-user',
      }
      mockFileRepository.create.mockResolvedValue({ ...createDTO, id: 1, created_at: new Date() })

      const result = await fileService.createFile(createDTO)

      expect(result).toMatchObject({
        ...createDTO,
        id: expect.any(Number),
        created_at: expect.any(Date),
      })
      expect(mockFileRepository.create).toHaveBeenCalledWith(createDTO)
    })

    it('should validate folder exists when specified', async () => {
      const createDTO: CreateFileDTO = {
        name: 'new.txt',
        type: 'text/plain',
        size: 1024,
        folder_id: 1,
        created_by: 'test-user',
      }
      mockFolderRepository.findById.mockResolvedValue(null)

      const result = await fileService.createFile(createDTO)

      expect(result).toBeNull()
      expect(mockFolderRepository.findById).toHaveBeenCalledWith(1)
      expect(mockFileRepository.create).not.toHaveBeenCalled()
    })

    it('should validate file size', async () => {
      const createDTO: CreateFileDTO = {
        name: 'new.txt',
        type: 'text/plain',
        size: -1,
        folder_id: null,
        created_by: 'test-user',
      }

      const result = await fileService.createFile(createDTO)

      expect(result).toBeNull()
      expect(mockFileRepository.create).not.toHaveBeenCalled()
    })
  })

  describe('updateFile', () => {
    it('should update an existing file', async () => {
      const updateData = {
        name: 'updated.txt',
        folder_id: 2,
      }
      mockFileRepository.findById.mockResolvedValue(mockFile)
      mockFolderRepository.findById.mockResolvedValue({ id: 2 })
      mockFileRepository.update.mockResolvedValue({ ...mockFile, ...updateData })

      const result = await fileService.updateFile(1, updateData)

      expect(result).toMatchObject({
        ...mockFile,
        ...updateData,
      })
      expect(mockFileRepository.update).toHaveBeenCalledWith(1, updateData)
    })

    it('should validate folder exists when updating folder_id', async () => {
      const updateData = {
        folder_id: 999,
      }
      mockFileRepository.findById.mockResolvedValue(mockFile)
      mockFolderRepository.findById.mockResolvedValue(null)

      const result = await fileService.updateFile(1, updateData)

      expect(result).toBeNull()
      expect(mockFileRepository.update).not.toHaveBeenCalled()
    })
  })

  describe('deleteFile', () => {
    it('should delete an existing file', async () => {
      mockFileRepository.remove.mockResolvedValue(mockFile)

      const result = await fileService.deleteFile(1)

      expect(result).toEqual(mockFile)
      expect(mockFileRepository.remove).toHaveBeenCalledWith(1)
    })
  })

  describe('bulkDeleteFiles', () => {
    it('should delete multiple files', async () => {
      const files = [mockFile, { ...mockFile, id: 2 }]
      mockFileRepository.bulkRemove.mockResolvedValue(files)

      const result = await fileService.bulkDeleteFiles([1, 2])

      expect(result).toEqual(files)
      expect(mockFileRepository.bulkRemove).toHaveBeenCalledWith([1, 2])
    })
  })

  describe('moveFiles', () => {
    it('should move files to a new folder', async () => {
      const files = [mockFile, { ...mockFile, id: 2 }]
      mockFolderRepository.findById.mockResolvedValue({ id: 3 })
      mockFileRepository.moveToFolder.mockResolvedValue(files.map(f => ({ ...f, folder_id: 3 })))

      const result = await fileService.moveFiles([1, 2], 3)

      expect(result).toEqual(files.map(f => ({ ...f, folder_id: 3 })))
      expect(mockFileRepository.moveToFolder).toHaveBeenCalledWith([1, 2], 3)
    })

    it('should validate target folder exists', async () => {
      mockFolderRepository.findById.mockResolvedValue(null)

      const result = await fileService.moveFiles([1, 2], 999)

      expect(result).toEqual([])
      expect(mockFileRepository.moveToFolder).not.toHaveBeenCalled()
    })
  })

  describe('getFileStats', () => {
    it('should return file statistics', async () => {
      const typeDistribution = [
        { type: 'text/plain', count: '2' },
        { type: 'application/pdf', count: '3' },
      ]
      const totalSize = 5120

      mockFileRepository.countByType.mockResolvedValue(typeDistribution)
      mockFileRepository.getTotalSize.mockResolvedValue(totalSize)

      const result = await fileService.getFileStats()

      expect(result).toEqual({
        totalFiles: 5,
        totalSize: 5120,
        typeDistribution: [
          { type: 'text/plain', count: 2 },
          { type: 'application/pdf', count: 3 },
        ],
      })
    })
  })
})
