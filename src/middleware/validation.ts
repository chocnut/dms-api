import { Request, Response, NextFunction } from 'express'
import { AnyZodObject, z } from 'zod'

export function validateRequest(schema: {
  body?: AnyZodObject
  query?: AnyZodObject
  params?: AnyZodObject
}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body)
      }

      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query)
      }

      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params)
      }

      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        })
        return
      }
      next(error)
    }
  }
}

export const createDocumentSchema = {
  body: z.object({
    name: z.string().min(1).max(255),
    type: z.string().min(1).max(50),
    size: z.number().positive(),
    folder_id: z.number().nullable().optional(),
    created_by: z.string().min(1).max(100),
  }),
}

export const createFolderSchema = {
  body: z.object({
    name: z.string().min(1).max(255),
    parent_id: z.number().nullable().optional(),
    created_by: z.string().min(1).max(100),
  }),
}

export const listFilesSchema = {
  query: z.object({
    folder_id: z
      .string()
      .optional()
      .transform(val => (val ? Number(val) : null)),
    page: z
      .string()
      .optional()
      .transform(val => (val ? Number(val) : 1)),
    limit: z
      .string()
      .optional()
      .transform(val => (val ? Number(val) : 10)),
    sort: z.string().optional().default('name'),
    order: z.enum(['asc', 'desc']).optional().default('asc'),
    search: z.string().optional(),
  }),
}
