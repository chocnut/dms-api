import { Request, Response, NextFunction } from 'express'

export function logger(req: Request, _res: Response, next: NextFunction) {
  const date = new Date().toISOString()
  console.log(`[${date}] ${req.method} ${req.url}`)
  next()
}

export function responseCapture(_req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send
  res.send = function (body) {
    res.locals.body = body
    return originalSend.call(this, body)
  }
  next()
}

export * from './validation'
