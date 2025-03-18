import { Request, Response, NextFunction, RequestHandler } from 'express'

export const asyncHandler =
  (
    handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
  ): RequestHandler =>
  (req, res, next): void => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
