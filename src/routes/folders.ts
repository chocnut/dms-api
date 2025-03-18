import { Router, Request, Response, NextFunction } from 'express'
import { db } from '../lib/db/config'
import { FolderResponse, SingleFolderResponse, CreateFolderRequest } from '../types/folder'

const router = Router()

/**
 * @swagger
 * /folders:
 *   get:
 *     summary: Get all folders
 *     description: Retrieve a list of all folders, optionally filtered by parent_id
 *     tags: [Folders]
 *     parameters:
 *       - in: query
 *         name: parent_id
 *         schema:
 *           type: integer
 *         description: Filter folders by parent folder ID
 *     responses:
 *       200:
 *         $ref: '#/components/responses/FolderResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { parent_id } = req.query

    let query = db
      .selectFrom('folders')
      .select(['id', 'name', 'parent_id', 'created_by', 'created_at'])
      .orderBy('created_at', 'desc')

    if (parent_id) {
      query = query.where('parent_id', '=', Number(parent_id))
    }

    const folders = await query.execute()

    const response: FolderResponse = {
      status: 'success',
      data: folders,
    }

    res.json(response)
  } catch (error) {
    next(error)
  }
})

/**
 * @swagger
 * /folders:
 *   post:
 *     summary: Create a new folder
 *     description: Create a new folder in the system
 *     tags: [Folders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - created_by
 *             properties:
 *               name:
 *                 type: string
 *                 description: Folder name
 *               parent_id:
 *                 type: integer
 *                 nullable: true
 *                 description: ID of the parent folder
 *               created_by:
 *                 type: string
 *                 description: User who created the folder
 *     responses:
 *       201:
 *         $ref: '#/components/responses/SingleFolderResponse'
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, parent_id, created_by } = req.body as CreateFolderRequest

    const folder = await db
      .insertInto('folders')
      .values({
        name,
        parent_id: parent_id || null,
        created_by,
      })
      .returning(['id', 'name', 'parent_id', 'created_by', 'created_at'])
      .executeTakeFirst()

    if (!folder) {
      return res.status(400).json({
        status: 'error',
        message: 'Failed to create folder',
      })
    }

    const response: SingleFolderResponse = {
      status: 'success',
      data: folder,
    }

    res.status(201).json(response)
  } catch (error) {
    next(error)
  }
})

export default router
