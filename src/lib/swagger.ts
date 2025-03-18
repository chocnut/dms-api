import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Document Management System API',
      version: '1.0.0',
      description: 'API for managing documents and folders',
    },
    servers: [
      {
        url: '/api',
        description: 'API server',
      },
    ],
    components: {
      schemas: {
        Document: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Document ID',
            },
            name: {
              type: 'string',
              description: 'Document name',
            },
            type: {
              type: 'string',
              description: 'Document type (e.g., pdf, docx)',
            },
            size: {
              type: 'integer',
              description: 'Document size in bytes',
            },
            folder_id: {
              type: ['integer', 'null'],
              description: 'ID of the folder containing this document, or null if at root',
            },
            created_by: {
              type: 'string',
              description: 'User who created the document',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
          },
        },
        Folder: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Folder ID',
            },
            name: {
              type: 'string',
              description: 'Folder name',
            },
            parent_id: {
              type: ['integer', 'null'],
              description: 'ID of the parent folder, or null if at root',
            },
            created_by: {
              type: 'string',
              description: 'User who created the folder',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
          },
        },
        File: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Item ID',
            },
            name: {
              type: 'string',
              description: 'Item name',
            },
            type: {
              type: 'string',
              enum: ['folder', 'document'],
              description: 'Item type',
            },
            size: {
              type: ['integer', 'null'],
              description: 'File size in bytes (null for folders)',
            },
            folder_id: {
              type: ['integer', 'null'],
              description: 'ID of the folder containing this item, or null if at root',
            },
            created_by: {
              type: 'string',
              description: 'User who created the item',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['error'],
              description: 'Error status',
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of items',
            },
            page: {
              type: 'integer',
              description: 'Current page number',
            },
            limit: {
              type: 'integer',
              description: 'Number of items per page',
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages',
            },
          },
        },
      },
      responses: {
        DocumentResponse: {
          description: 'Document list response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['success', 'error'],
                  },
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Document',
                    },
                  },
                },
              },
            },
          },
        },
        SingleDocumentResponse: {
          description: 'Single document response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['success', 'error'],
                  },
                  data: {
                    $ref: '#/components/schemas/Document',
                  },
                },
              },
            },
          },
        },
        FolderResponse: {
          description: 'Folder list response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['success', 'error'],
                  },
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Folder',
                    },
                  },
                },
              },
            },
          },
        },
        SingleFolderResponse: {
          description: 'Single folder response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['success', 'error'],
                  },
                  data: {
                    $ref: '#/components/schemas/Folder',
                  },
                },
              },
            },
          },
        },
        FileResponse: {
          description: 'File list response with pagination',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['success', 'error'],
                  },
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/File',
                    },
                  },
                  pagination: {
                    $ref: '#/components/schemas/Pagination',
                  },
                },
              },
            },
          },
        },
        ErrorResponse: {
          description: 'Error response',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
}

const swaggerSpec = swaggerJsdoc(options)

export default swaggerSpec
