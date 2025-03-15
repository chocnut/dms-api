import { Request, Response, NextFunction, Send } from 'express'

export interface RequestLog {
  timestamp: string
  method: string
  url: string
  status: number
  responseTime: number
  body?: Record<string, unknown>
  response?: unknown
}

type SendFunction = (body: Send) => Response

const responseBodyStore = new WeakMap<Response, Send>()

/**
 * Express middleware for logging requests and responses
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now()
  const originalSend: SendFunction = res.send

  res.send = function (this: Response, body: Send): Response {
    responseBodyStore.set(res, body)
    return originalSend.call(this, body)
  }

  res.on('finish', () => {
    const log: RequestLog = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: Date.now() - startTime,
    }

    if (process.env.NODE_ENV === 'development') {
      if (req.body && Object.keys(req.body).length > 0) {
        log.body = req.body as Record<string, unknown>
      }

      const responseBody = responseBodyStore.get(res)
      if (responseBody) {
        try {
          log.response = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody
        } catch (error) {
          log.response = responseBody
        }
      }
    }

    const output =
      process.env.NODE_ENV === 'development' ? JSON.stringify(log, null, 2) : JSON.stringify(log)

    console.log(output)
  })

  next()
}
