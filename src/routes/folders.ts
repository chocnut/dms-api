import { Router, Request, Response, NextFunction } from 'express'
import { db } from '../lib/db/config'
import { FolderResponse, SingleFolderResponse, CreateFolderRequest } from '../types/folder'

const router = Router()

/**
 * @route GET /api/folders
 * @description Get all folders
 * @access Public
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
 * @route POST /api/folders
 * @description Create a new folder
 * @access Public
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
