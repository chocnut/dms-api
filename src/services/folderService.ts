import { Kysely } from 'kysely'
import { Database } from '../lib/db/schema'
import { createFolderRepository, CreateFolderDTO, Folder } from '../repositories/folderRepository'

export interface FolderService {
  getAllFolders: (parentId?: number | null) => Promise<Folder[]>
  getFolderById: (id: number) => Promise<Folder | null>
  createFolder: (data: CreateFolderDTO) => Promise<Folder | null>
  updateFolder: (id: number, data: Partial<CreateFolderDTO>) => Promise<Folder | null>
  deleteFolder: (id: number) => Promise<Folder | null>
}

let folderServiceInstance: FolderService | null = null

export const createFolderService = (db: Kysely<Database>): FolderService => {
  if (folderServiceInstance) {
    return folderServiceInstance
  }

  const folderRepository = createFolderRepository(db)

  folderServiceInstance = {
    async getAllFolders(parentId?: number | null) {
      return await folderRepository.findAll(parentId)
    },

    async getFolderById(id: number) {
      return await folderRepository.findById(id)
    },

    async createFolder(data: CreateFolderDTO) {
      if (data.parent_id !== null) {
        const parentFolder = await folderRepository.findById(data.parent_id)
        if (!parentFolder) return null
      }

      return await folderRepository.create(data)
    },

    async updateFolder(id: number, data: Partial<CreateFolderDTO>) {
      const existingFolder = await folderRepository.findById(id)
      if (!existingFolder) return null

      if (data.parent_id !== undefined && data.parent_id !== null) {
        const parentFolder = await folderRepository.findById(data.parent_id)
        if (!parentFolder) return null
      }

      return await folderRepository.update(id, data)
    },

    async deleteFolder(id: number) {
      return await folderRepository.remove(id)
    },
  }

  return folderServiceInstance
}

// For testing purposes
export const resetFolderService = () => {
  folderServiceInstance = null
}

export default createFolderService
