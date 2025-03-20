import { Kysely } from 'kysely'
import { Database } from '../lib/db/schema'

export interface Folder {
  id: number
  name: string
  parent_id: number | null
  created_by: string
  created_at: Date
}

export interface CreateFolderDTO {
  name: string
  parent_id: number | null
  created_by: string
}

export const createFolderRepository = (db: Kysely<Database>) => {
  return {
    async findAll(parentId?: number | null) {
      let query = db.selectFrom('folders').selectAll().orderBy('created_at', 'desc')

      if (parentId !== undefined) {
        query = query.where('parent_id', '=', parentId)
      }

      return await query.execute()
    },

    async findById(id: number) {
      return (
        (await db.selectFrom('folders').selectAll().where('id', '=', id).executeTakeFirst()) || null
      )
    },

    async create(folder: CreateFolderDTO) {
      const [result] = await db
        .insertInto('folders')
        .values({
          ...folder,
          created_at: new Date(),
        })
        .execute()

      const insertId = Number(result.insertId)
      return await this.findById(insertId)
    },

    async update(id: number, data: Partial<CreateFolderDTO>) {
      await db.updateTable('folders').set(data).where('id', '=', id).execute()

      return await this.findById(id)
    },

    async remove(id: number) {
      const folder = await this.findById(id)
      if (!folder) return null

      const subfolders = await this.findAll(id)
      for (const subfolder of subfolders) {
        await this.remove(subfolder.id)
      }

      await db.deleteFrom('documents').where('folder_id', '=', id).execute()

      await db.deleteFrom('folders').where('id', '=', id).execute()

      return folder
    },
  }
}
