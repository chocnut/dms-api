import { Router, Request, Response } from 'express'
import { db } from '../lib/db/config'
import { FileResponse, FileType, File } from '../types/file'
import { z } from 'zod'
import { asyncHandler } from '../utils/routeHandler'
import { sql } from 'kysely'

const router = Router()

/**
 * @swagger
 * /files:
 *   get:
 *     summary: Get all files (folders and documents)
 *     description: Retrieve a list of both folders and documents
 *     tags: [Files]
 *     parameters:
 *       - in: query
 *         name: parent_id
 *         schema:
 *           type: integer
 *         description: Filter by parent folder ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, type, size, created_at]
 *           default: created_at
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order (ascending or descending)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter results by name
 *     responses:
 *       200:
 *         description: List of files (folders and documents)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const querySchema = z.object({
      parent_id: z.coerce.number().optional(),
      page: z.coerce.number().positive().default(1),
      limit: z.coerce.number().positive().max(100).default(10),
      sort: z.enum(['name', 'type', 'size', 'created_at']).default('created_at'),
      order: z.enum(['asc', 'desc']).default('desc'),
      search: z.string().optional(),
    })

    const result = querySchema.safeParse(req.query)

    if (!result.success) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid query parameters',
        errors: result.error.errors,
      })
      return
    }

    const { parent_id, page, limit, sort, order, search } = result.data

    const offset = (page - 1) * limit

    let foldersQuery = db
      .selectFrom('folders')
      .select([
        'id',
        'name',
        sql<FileType>`${'folder'}`.as('type'),
        sql<number>`0`.as('size'),
        'parent_id',
        'created_by',
        'created_at',
      ])

    let documentsQuery = db
      .selectFrom('documents')
      .select([
        'id',
        'name',
        sql<FileType>`type`.as('type'),
        'size',
        'folder_id as parent_id',
        'created_by',
        'created_at',
      ])

    if (parent_id) {
      foldersQuery = foldersQuery.where('parent_id', '=', parent_id)
      documentsQuery = documentsQuery.where('folder_id', '=', parent_id)
    } else {
      foldersQuery = foldersQuery.where(eb =>
        eb.or([eb('parent_id', 'is', null), eb('parent_id', '=', 0)])
      )
      documentsQuery = documentsQuery.where(eb =>
        eb.or([eb('folder_id', 'is', null), eb('folder_id', '=', 0)])
      )
    }

    if (search) {
      const searchTerm = `%${search}%`
      foldersQuery = foldersQuery.where('name', 'like', searchTerm)
      documentsQuery = documentsQuery.where('name', 'like', searchTerm)
    }

    const [folders, documents] = await Promise.all([
      foldersQuery.execute(),
      documentsQuery.execute(),
    ])

    const folderFiles: File[] = folders.map(folder => ({
      id: Number(folder.id),
      name: String(folder.name),
      type: folder.type,
      size: undefined,
      folder_id: folder.parent_id === null ? null : Number(folder.parent_id),
      created_by: String(folder.created_by),
      created_at: new Date(folder.created_at),
    }))

    const documentFiles: File[] = documents.map(doc => ({
      id: Number(doc.id),
      name: String(doc.name),
      type: doc.type,
      size: Number(doc.size),
      folder_id: doc.parent_id === null ? null : Number(doc.parent_id),
      created_by: String(doc.created_by),
      created_at: new Date(doc.created_at),
    }))

    const allFiles = [...folderFiles, ...documentFiles]

    if (sort === 'name') {
      allFiles.sort((a, b) =>
        order === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      )
    } else if (sort === 'type') {
      allFiles.sort((a, b) =>
        order === 'asc' ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type)
      )
    } else if (sort === 'size') {
      allFiles.sort((a, b) => {
        const sizeA = a.size ?? 0
        const sizeB = b.size ?? 0
        return order === 'asc' ? sizeA - sizeB : sizeB - sizeA
      })
    } else {
      allFiles.sort((a, b) =>
        order === 'asc'
          ? a.created_at.getTime() - b.created_at.getTime()
          : b.created_at.getTime() - a.created_at.getTime()
      )
    }

    const total = allFiles.length
    const totalPages = Math.ceil(total / limit)

    const paginatedFiles = allFiles.slice(offset, offset + limit)

    const response: FileResponse = {
      status: 'success',
      data: paginatedFiles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }

    res.json(response)
  })
)

export default router
