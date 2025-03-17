import { Router } from 'express'
import folderRoutes from './folders'
import documentRoutes from './documents'

const router = Router()

router.use('/folders', folderRoutes)
router.use('/documents', documentRoutes)

export default router
