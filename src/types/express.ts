import { Request, Response, NextFunction } from 'express'

// Create a custom type for Express route handlers to avoid TypeScript errors
export type RouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response> | void
