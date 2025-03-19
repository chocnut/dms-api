import { Kysely } from 'kysely'
import { Database } from '../lib/db/schema'

export interface Document {
  id: number
  name: string
  type: string
  size: number
  folder_id: number | null
  created_by: string
  created_at: Date
}

export interface CreateDocumentDTO {
  name: string
  type: string
  size: number
  folder_id: number | null
  created_by: string
}

export const createDocumentRepository = (db: Kysely<Database>) => {
  return {
    async findAll(folderId?: number | null) {
      let query = db.selectFrom('documents').selectAll().orderBy('created_at', 'desc')

      if (folderId !== undefined) {
        query = query.where('folder_id', '=', folderId)
      }

      return await query.execute()
    },

    async findById(id: number) {
      return (
        (await db.selectFrom('documents').selectAll().where('id', '=', id).executeTakeFirst()) ||
        null
      )
    },

    async create(document: CreateDocumentDTO) {
      const [result] = await db
        .insertInto('documents')
        .values({
          ...document,
          created_at: new Date(),
        })
        .execute()

      const insertId = Number(result.insertId)
      return await this.findById(insertId)
    },

    async update(id: number, data: Partial<CreateDocumentDTO>) {
      await db.updateTable('documents').set(data).where('id', '=', id).execute()

      return await this.findById(id)
    },

    async remove(id: number) {
      const document = await this.findById(id)
      if (!document) return null

      await db.deleteFrom('documents').where('id', '=', id).execute()

      return document
    },
  }
}
