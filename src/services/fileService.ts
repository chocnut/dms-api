import { Kysely } from 'kysely'
import { Database } from '../lib/db/schema'
import {
  createFileRepository,
  CreateFileDTO,
  File,
  FileFilters,
} from '../repositories/fileRepository'
import { createFolderRepository } from '../repositories/folderRepository'

export interface FileStats {
  totalFiles: number
  totalSize: number
  typeDistribution: Array<{ type: string; count: number }>
}

export interface FileService {
  getAllFiles: (filters?: FileFilters) => Promise<File[]>
  getFileById: (id: number) => Promise<File | null>
  createFile: (data: CreateFileDTO) => Promise<File | null>
  updateFile: (id: number, data: Partial<CreateFileDTO>) => Promise<File | null>
  deleteFile: (id: number) => Promise<File | null>
  bulkDeleteFiles: (ids: number[]) => Promise<File[]>
  moveFiles: (ids: number[], folderId: number | null) => Promise<File[]>
  getFileStats: () => Promise<FileStats>
}

export const createFileService = (db: Kysely<Database>): FileService => {
  const fileRepository = createFileRepository(db)
  const folderRepository = createFolderRepository(db)

  return {
    async getAllFiles(filters?: FileFilters) {
      return await fileRepository.findAll(filters)
    },

    async getFileById(id: number) {
      return await fileRepository.findById(id)
    },

    async createFile(data: CreateFileDTO) {
      if (data.folder_id !== null) {
        const folder = await folderRepository.findById(data.folder_id)
        if (!folder) return null
      }

      if (data.size < 0) return null
      if (!data.name.trim()) return null

      return await fileRepository.create(data)
    },

    async updateFile(id: number, data: Partial<CreateFileDTO>) {
      const existingFile = await fileRepository.findById(id)
      if (!existingFile) return null

      if (data.folder_id !== undefined && data.folder_id !== null) {
        const folder = await folderRepository.findById(data.folder_id)
        if (!folder) return null
      }

      if (data.size !== undefined && data.size < 0) return null

      if (data.name !== undefined && !data.name.trim()) return null

      return await fileRepository.update(id, data)
    },

    async deleteFile(id: number) {
      return await fileRepository.remove(id)
    },

    async bulkDeleteFiles(ids: number[]) {
      return await fileRepository.bulkRemove(ids)
    },

    async moveFiles(ids: number[], folderId: number | null) {
      if (folderId !== null) {
        const folder = await folderRepository.findById(folderId)
        if (!folder) return []
      }

      return await fileRepository.moveToFolder(ids, folderId)
    },

    async getFileStats(): Promise<FileStats> {
      const [typeDistribution, totalSize] = await Promise.all([
        fileRepository.countByType(),
        fileRepository.getTotalSize(),
      ])

      return {
        totalFiles: typeDistribution.reduce((sum, { count }) => sum + Number(count), 0),
        totalSize,
        typeDistribution: typeDistribution.map(({ type, count }) => ({
          type,
          count: Number(count),
        })),
      }
    },
  }
}

export default createFileService
