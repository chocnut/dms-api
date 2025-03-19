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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
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
 *     description: Creates a new document with random data, optionally in a specified folder
 *     tags: [Documents]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               folder_id:
 *                 type: integer
 *                 description: Optional folder ID to place the document in
 *     responses:
 *       201:
 *         $ref: '#/components/responses/SingleDocumentResponse'
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
