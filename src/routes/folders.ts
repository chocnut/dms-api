import { Router } from 'express'
import { db } from '../lib/db/config'
import { FolderResponse } from '../types/folder'

const router = Router()

/**
 * @route GET /api/folders
 * @description Get all folders
 * @access Public
 */
router.get('/', async (_req, res, next) => {
  try {
    const folders = await db
      .selectFrom('folders')
      .select(['id', 'name', 'parent_id', 'created_by', 'created_at'])
      .orderBy('created_at', 'desc')
      .execute()

    const response: FolderResponse = {
      status: 'success',
      data: folders,
    }

    res.json(response)
  } catch (error) {
    next(error)
  }
})

export default router
