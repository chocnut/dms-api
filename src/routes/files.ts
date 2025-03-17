import { Router, Request, Response, NextFunction } from 'express'
import { db } from '../lib/db/config'
import { FileResponse, FileType, File } from '../types/file'
import { sql } from 'kysely'

const router = Router()

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { folder_id, page = '1', limit = '10', sort = 'name', order = 'asc' } = req.query

    const pageNumber = parseInt(page as string, 10)
    const limitNumber = parseInt(limit as string, 10)
    const offset = (pageNumber - 1) * limitNumber

    // Get folders
    let folderQuery = db
      .selectFrom('folders')
      .select([
        'id',
        'name',
        sql<FileType>`${'folder'}`.as('type'),
        sql<number | null>`NULL`.as('size'),
        'parent_id as folder_id',
        'created_by',
        'created_at',
      ])

    // Get documents
    let documentQuery = db
      .selectFrom('documents')
      .select([
        'id',
        'name',
        sql<FileType>`${'document'}`.as('type'),
        'size',
        'folder_id',
        'created_by',
        'created_at',
      ])

    // Apply folder filtering if provided
    if (folder_id) {
      folderQuery = folderQuery.where('parent_id', '=', Number(folder_id))
      documentQuery = documentQuery.where('folder_id', '=', Number(folder_id))
    } else {
      // If no folder_id is provided, show root level items
      folderQuery = folderQuery.where('parent_id', 'is', null)
      documentQuery = documentQuery.where('folder_id', 'is', null)
    }

    // Get total counts for pagination
    const folderCountResult = await db
      .selectFrom('folders')
      .select(({ fn }) => [fn.count('id').as('count')])
      .where(eb =>
        folder_id ? eb('parent_id', '=', Number(folder_id)) : eb('parent_id', 'is', null)
      )
      .executeTakeFirst()

    const documentCountResult = await db
      .selectFrom('documents')
      .select(({ fn }) => [fn.count('id').as('count')])
      .where(eb =>
        folder_id ? eb('folder_id', '=', Number(folder_id)) : eb('folder_id', 'is', null)
      )
      .executeTakeFirst()

    const folderCount = folderCountResult ? Number(folderCountResult.count) : 0
    const documentCount = documentCountResult ? Number(documentCountResult.count) : 0
    const totalCount = folderCount + documentCount
    const totalPages = Math.ceil(totalCount / limitNumber)

    // Union folders and documents
    const unionQuery = folderQuery.union(documentQuery)

    // Apply sorting
    const sortField = sort as string
    if (sortField === 'name' || sortField === 'created_at') {
      unionQuery.orderBy(sortField, order === 'desc' ? 'desc' : 'asc')
    }

    // Add secondary sort by type to group folders and documents
    unionQuery.orderBy('type', 'asc')

    // Apply pagination
    unionQuery.limit(limitNumber).offset(offset)

    const files = await unionQuery.execute()

    const response: FileResponse = {
      status: 'success',
      data: files as unknown as File[],
      pagination: {
        total: totalCount,
        page: pageNumber,
        limit: limitNumber,
        totalPages,
      },
    }

    res.json(response)
  } catch (error) {
    next(error)
  }
})

export default router
