import { Router, Request, Response } from 'express'
import { db } from '../lib/db/config'
import { FolderResponse, SingleFolderResponse } from '../types/folder'
import { z } from 'zod'
import { asyncHandler } from '../utils/routeHandler'

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
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
  })
)

/**
 * @swagger
 * /folders/{id}:
 *   get:
 *     summary: Get a folder by ID
 *     description: Retrieve a single folder by its ID
 *     tags: [Folders]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Folder ID
 *     responses:
 *       200:
 *         $ref: '#/components/responses/SingleFolderResponse'
 *       404:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id)

    const folder = await db
      .selectFrom('folders')
      .select(['id', 'name', 'parent_id', 'created_by', 'created_at'])
      .where('id', '=', id)
      .executeTakeFirst()

    if (!folder) {
      res.status(404).json({
        status: 'error',
        message: 'Folder not found',
      })
      return
    }

    const response: SingleFolderResponse = {
      status: 'success',
      data: folder,
    }

    res.json(response)
  })
)

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
 *               parent_id:
 *                 type: integer
 *               created_by:
 *                 type: string
 *     responses:
 *       201:
 *         $ref: '#/components/responses/SingleFolderResponse'
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const folderSchema = z.object({
        name: z.string().min(1).max(255),
        parent_id: z.number().nullable().optional(),
        created_by: z.string().min(1).max(100),
      })

      const validatedBody = await folderSchema.parseAsync(req.body)
      const { name, parent_id, created_by } = validatedBody

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
        res.status(400).json({
          status: 'error',
          message: 'Failed to create folder',
        })
        return
      }

      const response: SingleFolderResponse = {
        status: 'success',
        data: folder,
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
 * /folders/{id}:
 *   put:
 *     summary: Update a folder
 *     description: Update an existing folder
 *     tags: [Folders]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Folder ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               parent_id:
 *                 type: integer
 *     responses:
 *       200:
 *         $ref: '#/components/responses/SingleFolderResponse'
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

      const folderSchema = z.object({
        name: z.string().min(1).max(255).optional(),
        parent_id: z.number().nullable().optional(),
      })

      const validatedBody = await folderSchema.parseAsync(req.body)

      if (Object.keys(validatedBody).length === 0) {
        res.status(400).json({
          status: 'error',
          message: 'No valid fields to update',
        })
        return
      }

      const folder = await db
        .updateTable('folders')
        .set(validatedBody)
        .where('id', '=', id)
        .returning(['id', 'name', 'parent_id', 'created_by', 'created_at'])
        .executeTakeFirst()

      if (!folder) {
        res.status(404).json({
          status: 'error',
          message: 'Folder not found',
        })
        return
      }

      const response: SingleFolderResponse = {
        status: 'success',
        data: folder,
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
 * /folders/{id}:
 *   delete:
 *     summary: Delete a folder
 *     description: Delete a folder and all its contents
 *     tags: [Folders]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Folder ID
 *     responses:
 *       200:
 *         $ref: '#/components/responses/SingleFolderResponse'
 *       404:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id)

    const folder = await db
      .deleteFrom('folders')
      .where('id', '=', id)
      .returning(['id', 'name', 'parent_id', 'created_by', 'created_at'])
      .executeTakeFirst()

    if (!folder) {
      res.status(404).json({
        status: 'error',
        message: 'Folder not found',
      })
      return
    }

    const response: SingleFolderResponse = {
      status: 'success',
      data: folder,
    }

    res.json(response)
  })
)

export default router
