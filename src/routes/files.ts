import { Router, Request, Response } from 'express'
import { db } from '../lib/db/config'
import { FileResponse, FileType, File } from '../types/file'
import { z } from 'zod'
import { asyncHandler } from '../utils/routeHandler'
import { createFolderService } from '../services/folderService'
import { createDocumentService } from '../services/documentService'

const router = Router()
const folderService = createFolderService(db)
const documentService = createDocumentService(db)

const querySchema = z.object({
  folder_id: z.coerce.number().optional(),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(10),
  sort: z.enum(['name', 'type', 'size', 'created_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
})

/**
 * @swagger
 * /files:
 *   get:
 *     summary: Get all files (folders and documents)
 *     description: Retrieve a list of both folders and documents
 *     tags: [Files]
 *     parameters:
 *       - in: query
 *         name: folder_id
 *         schema:
 *           type: integer
 *         description: Filter by folder ID
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
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const result = querySchema.safeParse(req.query)

      if (!result.success) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid query parameters',
          errors: result.error.errors,
        })
        return
      }

      const { folder_id, page, limit, sort, order, search } = result.data

      console.log('Query parameters:', {
        folder_id,
        folder_id_type: typeof folder_id,
        folder_id_null: folder_id ?? null,
        page,
        limit,
        sort,
        order,
        search,
      })

      const [folders, documents] = await Promise.all([
        folderService.getAllFolders(folder_id === undefined ? undefined : folder_id),
        documentService.getAllDocuments(folder_id === undefined ? undefined : folder_id),
      ])

      const folderFiles: File[] = folders.map(folder => ({
        id: Number(folder.id),
        name: String(folder.name),
        type: 'folder' as FileType,
        size: undefined,
        folder_id: folder.parent_id === null ? null : Number(folder.parent_id),
        created_by: String(folder.created_by),
        created_at: new Date(folder.created_at),
      }))

      const documentFiles: File[] = documents.map(doc => ({
        id: Number(doc.id),
        name: String(doc.name),
        type: 'document' as FileType,
        size: Number(doc.size),
        folder_id: doc.folder_id === null ? null : Number(doc.folder_id),
        created_by: String(doc.created_by),
        created_at: new Date(doc.created_at),
      }))

      const allFiles = [...folderFiles, ...documentFiles].filter(
        file => !search || file.name.toLowerCase().includes(search.toLowerCase())
      )

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
      const offset = (page - 1) * limit
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
    } catch (error) {
      console.error('Error in files route:', error)
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      })
    }
  })
)

export default router
