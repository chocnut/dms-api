import { Kysely } from 'kysely'
import { Database } from '../lib/db/schema'

export interface File {
  id: number
  name: string
  type: string
  size: number
  folder_id: number | null
  created_by: string
  created_at: Date
}

export interface CreateFileDTO {
  name: string
  type: string
  size: number
  folder_id: number | null
  created_by: string
}

export interface FileFilters {
  folder_id?: number | null
  type?: string
  search?: string
  sort?: 'name' | 'type' | 'size' | 'created_at'
  order?: 'asc' | 'desc'
}

export const createFileRepository = (db: Kysely<Database>) => {
  return {
    async findAll(filters: FileFilters = {}) {
      let query = db.selectFrom('documents').selectAll()

      if (filters.folder_id !== undefined) {
        query = query.where('folder_id', '=', filters.folder_id)
      }

      if (filters.type) {
        query = query.where('type', '=', filters.type)
      }

      if (filters.search) {
        query = query.where('name', 'like', `%${filters.search}%`)
      }

      const sortField = filters.sort || 'created_at'
      const sortOrder = filters.order || 'desc'
      query = query.orderBy(sortField, sortOrder)

      return await query.execute()
    },

    async findById(id: number) {
      return (
        (await db.selectFrom('documents').selectAll().where('id', '=', id).executeTakeFirst()) ||
        null
      )
    },

    async findByIds(ids: number[]) {
      if (ids.length === 0) return []

      return await db.selectFrom('documents').selectAll().where('id', 'in', ids).execute()
    },

    async create(file: CreateFileDTO) {
      const [result] = await db
        .insertInto('documents')
        .values({
          ...file,
          created_at: new Date(),
        })
        .execute()

      const insertId = Number(result.insertId)
      return await this.findById(insertId)
    },

    async update(id: number, data: Partial<CreateFileDTO>) {
      await db.updateTable('documents').set(data).where('id', '=', id).execute()

      return await this.findById(id)
    },

    async remove(id: number) {
      const file = await this.findById(id)
      if (!file) return null

      await db.deleteFrom('documents').where('id', '=', id).execute()

      return file
    },

    async bulkRemove(ids: number[]) {
      if (ids.length === 0) return []

      const files = await this.findByIds(ids)
      if (files.length === 0) return []

      await db.deleteFrom('documents').where('id', 'in', ids).execute()

      return files
    },

    async moveToFolder(ids: number[], folderId: number | null) {
      const files = await this.findByIds(ids)
      if (files.length === 0) return []

      await db
        .updateTable('documents')
        .set({ folder_id: folderId })
        .where('id', 'in', ids)
        .execute()

      return await this.findByIds(ids)
    },

    async countByType() {
      return await db
        .selectFrom('documents')
        .select(['type', db.fn.count('id').as('count')])
        .groupBy('type')
        .execute()
    },

    async getTotalSize() {
      const result = await db
        .selectFrom('documents')
        .select(db.fn.sum('size').as('total_size'))
        .executeTakeFirst()

      return Number(result?.total_size || 0)
    },
  }
}
