import { Router, Request, Response } from 'express'
import { db } from '../lib/db/config'
import { asyncHandler } from '../utils/routeHandler'
import { z } from 'zod'

const router = Router()

const documentTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]

const fileNames = [
  'report',
  'document',
  'presentation',
  'spreadsheet',
  'image',
  'contract',
  'invoice',
  'proposal',
]

const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)]
}

const generateRandomDocument = (folder_id?: number | null) => {
  const type = getRandomElement(documentTypes)
  const extension = type.split('/')[1]
  const baseName = getRandomElement(fileNames)
  const randomNumber = Math.floor(Math.random() * 1000)

  return {
    name: `${baseName}_${randomNumber}.${extension}`,
    type,
    size: Math.floor(Math.random() * (10485760 - 1024 + 1)) + 1024,
    created_by: 'John Green',
    created_at: new Date(),
    folder_id: folder_id ?? null,
  }
}

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
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { folder_id } = req.query

    let query = db.selectFrom('documents').selectAll()

    if (folder_id !== undefined) {
      query = query.where('folder_id', '=', Number(folder_id))
    }

    const documents = await query.execute()

    res.json({
      status: 'success',
      data: documents,
    })
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
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const documentSchema = z.object({
      folder_id: z.number().nullable().optional(),
    })

    const validatedBody = await documentSchema.parseAsync(req.body)
    const { folder_id } = validatedBody

    const randomDocument = generateRandomDocument(folder_id)

    const result = await db.insertInto('documents').values(randomDocument).execute()

    const insertId = Number(result[0].insertId)

    const document = await db
      .selectFrom('documents')
      .selectAll()
      .where('id', '=', insertId)
      .executeTakeFirstOrThrow()

    res.status(201).json({
      status: 'success',
      data: document,
    })
  })
)

export default router
