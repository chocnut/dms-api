import { Router, Request, Response, NextFunction } from 'express'
import { db } from '../lib/db/config'
import { DocumentResponse, SingleDocumentResponse, CreateDocumentRequest } from '../types/document'

const router = Router()

/**
 * @route GET /api/documents
 * @description Get all documents with optional folder filtering
 * @access Public
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { folder_id } = req.query

    let query = db
      .selectFrom('documents')
      .select(['id', 'name', 'type', 'size', 'folder_id', 'created_by', 'created_at'])
      .orderBy('created_at', 'desc')

    // Filter by folder_id if provided
    if (folder_id) {
      query = query.where('folder_id', '=', Number(folder_id))
    }

    const documents = await query.execute()

    const response: DocumentResponse = {
      status: 'success',
      data: documents,
    }

    res.json(response)
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, type, size, folder_id, created_by } = req.body as CreateDocumentRequest

    const document = await db
      .insertInto('documents')
      .values({
        name,
        type,
        size,
        folder_id: folder_id || null,
        created_by,
      })
      .returning(['id', 'name', 'type', 'size', 'folder_id', 'created_by', 'created_at'])
      .executeTakeFirst()

    if (!document) {
      return res.status(400).json({
        status: 'error',
        message: 'Failed to create document',
      })
    }

    const response: SingleDocumentResponse = {
      status: 'success',
      data: document,
    }

    res.status(201).json(response)
  } catch (error) {
    next(error)
  }
})

export default router
