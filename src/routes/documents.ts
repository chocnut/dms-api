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
 * /documents/{id}:
 *   get:
 *     summary: Get a document by ID
 *     description: Retrieve a single document by its ID
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Document ID
 *     responses:
 *       200:
 *         $ref: '#/components/responses/SingleDocumentResponse'
 *       404:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id)

    const document = await db
      .selectFrom('documents')
      .select(['id', 'name', 'type', 'size', 'folder_id', 'created_by', 'created_at'])
      .where('id', '=', id)
      .executeTakeFirst()

    if (!document) {
      res.status(404).json({
        status: 'error',
        message: 'Document not found',
      })
      return
    }

    const response: SingleDocumentResponse = {
      status: 'success',
      data: document,
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

/**
 * @swagger
 * /documents/{id}:
 *   put:
 *     summary: Update a document
 *     description: Update an existing document's metadata
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               folder_id:
 *                 type: integer
 *     responses:
 *       200:
 *         $ref: '#/components/responses/SingleDocumentResponse'
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       404:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id)

      const documentSchema = z.object({
        name: z.string().min(1).max(255).optional(),
        folder_id: z.number().nullable().optional(),
      })

      const validatedBody = await documentSchema.parseAsync(req.body)

      if (Object.keys(validatedBody).length === 0) {
        res.status(400).json({
          status: 'error',
          message: 'No valid fields to update',
        })
        return
      }

      const document = await db
        .update('documents')
        .set(validatedBody)
        .where('id', '=', id)
        .returning(['id', 'name', 'type', 'size', 'folder_id', 'created_by', 'created_at'])
        .executeTakeFirst()

      if (!document) {
        res.status(404).json({
          status: 'error',
          message: 'Document not found',
        })
        return
      }

      const response: SingleDocumentResponse = {
        status: 'success',
        data: document,
      }

      res.json(response)
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

/**
 * @swagger
 * /documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     description: Delete a document from the system
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Document ID
 *     responses:
 *       200:
 *         $ref: '#/components/responses/SingleDocumentResponse'
 *       404:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id)

    const document = await db
      .deleteFrom('documents')
      .where('id', '=', id)
      .returning(['id', 'name', 'type', 'size', 'folder_id', 'created_by', 'created_at'])
      .executeTakeFirst()

    if (!document) {
      res.status(404).json({
        status: 'error',
        message: 'Document not found',
      })
      return
    }

    const response: SingleDocumentResponse = {
      status: 'success',
      data: document,
    }

    res.json(response)
  })
)

export default router
