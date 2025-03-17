import { Router } from 'express'
import folderRoutes from './folders'
import documentRoutes from './documents'
import fileRoutes from './files'

const router = Router()

router.use('/folders', folderRoutes)
router.use('/documents', documentRoutes)
router.use('/files', fileRoutes)

export default router
