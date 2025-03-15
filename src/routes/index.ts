import { Router } from 'express'
import folderRoutes from './folders'

const router = Router()

router.use('/folders', folderRoutes)

export default router
