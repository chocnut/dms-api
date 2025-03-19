import { Router, Request, Response } from 'express'
import { db } from '../lib/db/config'
import { createFolderService } from '../services/folderService'
import { asyncHandler } from '../utils/routeHandler'
import { z } from 'zod'

const router = Router()
const folderService = createFolderService(db)

const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parent_id: z.number().nullable().optional(),
  created_by: z.string().min(1).max(100),
})

const updateFolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  parent_id: z.number().nullable().optional(),
})

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
  asyncHandler(async (req: Request, res: Response) => {
    const parentId = req.query.parent_id ? Number(req.query.parent_id) : undefined
    const folders = await folderService.getAllFolders(parentId)
    res.json({ status: 'success', data: folders })
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
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const folder = await folderService.getFolderById(id)

    if (!folder) {
      res.status(404).json({
        status: 'error',
        message: 'Folder not found',
      })
      return
    }

    res.json({
      status: 'success',
      data: folder,
    })
  })
)

/**
 * @swagger
 * /folders/{id}/path:
 *   get:
 *     summary: Get folder path
 *     description: Retrieve the path from root to the specified folder
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
 *         $ref: '#/components/responses/FolderResponse'
 *       404:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get(
  '/:id/path',
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const path = await folderService.getFolderPath(id)

    if (path.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'Folder not found',
      })
      return
    }

    res.json({
      status: 'success',
      data: path,
    })
  })
)

/**
 * @swagger
 * /folders:
 *   post:
 *     summary: Create a new folder
 *     description: Create a new folder with the provided name
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
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const validatedData = await createFolderSchema.parseAsync(req.body)
      const folderData = {
        ...validatedData,
        parent_id: validatedData.parent_id ?? null,
      }
      const folder = await folderService.createFolder(folderData)

      if (!folder) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid folder data or parent folder not found',
        })
        return
      }

      res.status(201).json({
        status: 'success',
        data: folder,
      })
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
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id)
      const updateData = await updateFolderSchema.parseAsync(req.body)

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          status: 'error',
          message: 'No valid fields to update',
        })
        return
      }

      const folder = await folderService.updateFolder(id, updateData)

      if (!folder) {
        res.status(404).json({
          status: 'error',
          message: 'Folder not found or invalid update data',
        })
        return
      }

      res.json({
        status: 'success',
        data: folder,
      })
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
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const folder = await folderService.deleteFolder(id)

    if (!folder) {
      res.status(404).json({
        status: 'error',
        message: 'Folder not found',
      })
      return
    }

    res.json({
      status: 'success',
      data: folder,
    })
  })
)

export default router
