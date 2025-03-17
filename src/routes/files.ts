import { Router, Request, Response, NextFunction } from 'express'
import { db } from '../lib/db/config'
import { FileResponse, FileType, File } from '../types/file'
import { sql } from 'kysely'

const router = Router()

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { folder_id, page = '1', limit = '10', sort = 'name', order = 'asc', search } = req.query

    const pageNumber = parseInt(page as string, 10)
    const limitNumber = parseInt(limit as string, 10)
    const offset = (pageNumber - 1) * limitNumber

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

    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`
      folderQuery = folderQuery.where('name', 'like', searchTerm)
      documentQuery = documentQuery.where('name', 'like', searchTerm)
    }

    if (folder_id) {
      folderQuery = folderQuery.where('parent_id', '=', Number(folder_id))
      documentQuery = documentQuery.where('folder_id', '=', Number(folder_id))
    } else {
      folderQuery = folderQuery.where('parent_id', 'is', null)
      documentQuery = documentQuery.where('folder_id', 'is', null)
    }

    let folderCountQuery = db.selectFrom('folders').select(({ fn }) => [fn.count('id').as('count')])

    if (search && typeof search === 'string' && search.trim() !== '') {
      folderCountQuery = folderCountQuery.where('name', 'like', `%${search.trim()}%`)
    }

    if (folder_id) {
      folderCountQuery = folderCountQuery.where('parent_id', '=', Number(folder_id))
    } else {
      folderCountQuery = folderCountQuery.where('parent_id', 'is', null)
    }

    let documentCountQuery = db
      .selectFrom('documents')
      .select(({ fn }) => [fn.count('id').as('count')])

    if (search && typeof search === 'string' && search.trim() !== '') {
      documentCountQuery = documentCountQuery.where('name', 'like', `%${search.trim()}%`)
    }

    if (folder_id) {
      documentCountQuery = documentCountQuery.where('folder_id', '=', Number(folder_id))
    } else {
      documentCountQuery = documentCountQuery.where('folder_id', 'is', null)
    }

    const folderCountResult = await folderCountQuery.executeTakeFirst()
    const documentCountResult = await documentCountQuery.executeTakeFirst()

    const folderCount = folderCountResult ? Number(folderCountResult.count) : 0
    const documentCount = documentCountResult ? Number(documentCountResult.count) : 0
    const totalCount = folderCount + documentCount
    const totalPages = Math.ceil(totalCount / limitNumber)

    const unionQuery = folderQuery.union(documentQuery)

    const sortField = sort as string
    if (sortField === 'name' || sortField === 'created_at') {
      unionQuery.orderBy(sortField, order === 'desc' ? 'desc' : 'asc')
    }

    unionQuery.orderBy('type', 'asc')
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
