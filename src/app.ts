import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './lib/swagger'
import { logger, responseCapture } from './middleware'
import apiRoutes from './routes'

const app = express()

app.use(helmet())
app.use(compression())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(logger)
app.use(responseCapture)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.use('/api', apiRoutes)

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check if the API is running
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found',
  })
})

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
  })
})

export default app
