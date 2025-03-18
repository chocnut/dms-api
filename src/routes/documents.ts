import { Router, Request, Response, NextFunction } from 'express'
import { db } from '../lib/db/config'
import { DocumentResponse, SingleDocumentResponse, CreateDocumentRequest } from '../types/document'

const router = Router()

/**
 * @swagger
 * /documents:
 *   get:
 *     summary: Get all documents
 *     description: Retrieve a list of all documents, optionally filtered by folder_id
 *     tags: [Documents]
 *     parameters:
 *       - in: query
 *         name: folder_id
 *         schema:
 *           type: integer
 *         description: Filter documents by folder ID
 *     responses:
 *       200:
 *         $ref: '#/components/responses/DocumentResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
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

/**
 * @swagger
 * /documents:
 *   post:
 *     summary: Create a new document
 *     description: Upload a new document to the system
 *     tags: [Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - size
 *               - created_by
 *             properties:
 *               name:
 *                 type: string
 *                 description: Document name
 *               type:
 *                 type: string
 *                 description: Document type (e.g., pdf, docx)
 *               size:
 *                 type: integer
 *                 description: Document size in bytes
 *               folder_id:
 *                 type: integer
 *                 nullable: true
 *                 description: ID of the folder to place the document in
 *               created_by:
 *                 type: string
 *                 description: User who created the document
 *     responses:
 *       201:
 *         $ref: '#/components/responses/SingleDocumentResponse'
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
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
