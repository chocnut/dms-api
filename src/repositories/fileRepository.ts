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
  }
}
