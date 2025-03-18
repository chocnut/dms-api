import { Router, Request, Response } from 'express'
import { db } from '../lib/db/config'
import { DocumentResponse, SingleDocumentResponse } from '../types/document'
import { z } from 'zod'
import { asyncHandler } from '../utils/routeHandler'

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
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { folder_id } = req.query

    let query = db
      .selectFrom('documents')
      .select(['id', 'name', 'type', 'size', 'folder_id', 'created_by', 'created_at'])
      .orderBy('created_at', 'desc')

    if (folder_id) {
      query = query.where('folder_id', '=', Number(folder_id))
    }

    const documents = await query.execute()

    const response: DocumentResponse = {
      status: 'success',
      data: documents,
    }

    res.json(response)
  })
)

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
 *               type:
 *                 type: string
 *               size:
 *                 type: integer
 *               folder_id:
 *                 type: integer
 *               created_by:
 *                 type: string
 *     responses:
 *       201:
 *         $ref: '#/components/responses/SingleDocumentResponse'
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const documentSchema = z.object({
        name: z.string().min(1).max(255),
        type: z.string().min(1).max(50),
        size: z.number().positive(),
        folder_id: z.number().nullable().optional(),
        created_by: z.string().min(1).max(100),
      })

      const validatedBody = await documentSchema.parseAsync(req.body)
      const { name, type, size, folder_id, created_by } = validatedBody

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
        res.status(400).json({
          status: 'error',
          message: 'Failed to create document',
        })
        return
      }

      const response: SingleDocumentResponse = {
        status: 'success',
        data: document,
      }

      res.status(201).json(response)
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        })
        return
      }
      throw error
    }
  })
)

export default router
