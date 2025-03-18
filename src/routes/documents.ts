import { Router, Request, Response } from 'express'
import { db } from '../lib/db/config'
import { asyncHandler } from '../utils/routeHandler'

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

const generateRandomDocument = () => {
  const type = getRandomElement(documentTypes)
  const extension = type.split('/')[1]
  const baseName = getRandomElement(fileNames)
  const randomNumber = Math.floor(Math.random() * 1000)

  return {
    name: `${baseName}_${randomNumber}.${extension}`,
    type,
    size: Math.floor(Math.random() * (10485760 - 1024 + 1)) + 1024, // Between 1KB and 10MB
    created_by: 'John Green',
    created_at: new Date(),
    folder_id: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : null,
  }
}

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
  asyncHandler(async (req: Request, res: Response) => {
    const { folder_id } = req.query

    let query = db
      .selectFrom('documents')
      .select(['id', 'name', 'type', 'size', 'folder_id', 'created_by', 'created_at'])
      .orderBy('created_at', 'desc')

    if (folder_id) {
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
 *     description: Creates a new document with fake data
 *     tags: [Documents]
 *     responses:
 *       201:
 *         description: Document created successfully
 */
router.post(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const document = generateRandomDocument()

    const result = await db.insertInto('documents').values(document).execute()

    const insertId = Number(result[0].insertId)

    const insertedDocument = await db
      .selectFrom('documents')
      .selectAll()
      .where('id', '=', insertId)
      .executeTakeFirstOrThrow()

    res.status(201).json({
      status: 'success',
      data: insertedDocument,
    })
  })
)

export default router
