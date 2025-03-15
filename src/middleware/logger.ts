import morgan from 'morgan'
import { Request, Response } from 'express'
import { NextFunction } from 'express'

export interface RequestLog {
  timestamp: string
  method: string
  url: string
  status: number
  responseTime: number
  body?: Record<string, unknown>
  response?: unknown
}

const responseStore = new WeakMap<Response, unknown>()

export const responseCapture = (_req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json
  const originalSend = res.send

  res.json = function (body: unknown) {
    responseStore.set(res, body)
    return originalJson.call(this, body)
  }

  res.send = function (body: unknown) {
    if (typeof body === 'string') {
      try {
        const jsonBody = JSON.parse(body)
        responseStore.set(res, jsonBody)
      } catch {
        responseStore.set(res, body)
      }
    } else {
      responseStore.set(res, body)
    }
    return originalSend.call(this, body)
  }

  next()
}

morgan.token('responseData', (_req: Request, res: Response) => {
  const data = responseStore.get(res)
  return data ? JSON.stringify(data) : '-'
})

const developmentFormat: morgan.FormatFn<Request, Response> = (tokens, req, res) => {
  const log: RequestLog = {
    timestamp: tokens.date(req, res, 'iso') || new Date().toISOString(),
    method: tokens.method(req, res) || '-',
    url: tokens.url(req, res) || '-',
    status: parseInt(tokens.status(req, res) || '0', 10),
    responseTime: parseInt(tokens['response-time'](req, res) || '0', 10),
  }

  if (process.env.NODE_ENV === 'development') {
    if (req.body && Object.keys(req.body).length > 0) {
      log.body = req.body
    }

    const responseData = tokens.responseData(req, res)
    if (responseData && responseData !== '-') {
      log.response = JSON.parse(responseData)
    }
  }

  return JSON.stringify(log, null, 2)
}

export const logger = morgan(developmentFormat, {
  skip: (_req, _res) => process.env.NODE_ENV !== 'development',
})
