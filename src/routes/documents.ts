import { Router } from 'express'
import { db } from '../lib/db/config'
import { createDocumentService } from '../services/documentService'
import { asyncHandler } from '../utils/routeHandler'
import { z } from 'zod'

const router = Router()
const documentService = createDocumentService(db)

const createDocumentSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number(),
  folder_id: z.number().nullable(),
  created_by: z.string(),
})

const updateDocumentSchema = z.object({
  name: z.string().optional(),
  folder_id: z.number().nullable().optional(),
})

/**
 * @swagger
 * /documents:
 *   get:
 *     summary: Get all documents
 *     description: Retrieve a list of documents with pagination, optionally filtered by folder_id
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
  asyncHandler(async (req, res) => {
    const folderId = req.query.folder_id ? Number(req.query.folder_id) : undefined
    const documents = await documentService.getAllDocuments(folderId)
    return res.json({ status: 'success', data: documents })
  })
)

/**
 * @swagger
 * /documents/{id}:
 *   get:
 *     summary: Get document by ID
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
  asyncHandler(async (req, res) => {
    const document = await documentService.getDocumentById(Number(req.params.id))
    if (!document) {
      return res.status(404).json({ status: 'error', message: 'Document not found' })
    }
    return res.json({ status: 'success', data: document })
  })
)

/**
 * @swagger
 * /documents:
 *   post:
 *     summary: Create a new document
 *     description: Create a new document with the provided data
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
 *                 type: number
 *               folder_id:
 *                 type: integer
 *                 nullable: true
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
  asyncHandler(async (req, res) => {
    const validatedData = await createDocumentSchema.parseAsync(req.body)
    const document = await documentService.createDocument(validatedData)
    if (!document) {
      return res.status(400).json({ status: 'error', message: 'Failed to create document' })
    }
    return res.status(201).json({ status: 'success', data: document })
  })
)

/**
 * @swagger
 * /documents/{id}:
 *   put:
 *     summary: Update a document
 *     description: Update an existing document by its ID
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
 *                 nullable: true
 *     responses:
 *       200:
 *         $ref: '#/components/responses/SingleDocumentResponse'
 *       404:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const validatedData = await updateDocumentSchema.parseAsync(req.body)
    const document = await documentService.updateDocument(Number(req.params.id), validatedData)
    if (!document) {
      return res.status(404).json({ status: 'error', message: 'Document not found' })
    }
    return res.json({ status: 'success', data: document })
  })
)

/**
 * @swagger
 * /documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     description: Delete an existing document by its ID
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
  asyncHandler(async (req, res) => {
    const document = await documentService.deleteDocument(Number(req.params.id))
    if (!document) {
      return res.status(404).json({ status: 'error', message: 'Document not found' })
    }
    return res.json({ status: 'success', data: document })
  })
)

export default router
