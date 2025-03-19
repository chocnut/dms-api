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
      },
    ],
    components: {
      schemas: {
        Document: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
            },
            name: {
              type: 'string',
            },
            type: {
              type: 'string',
            },
            size: {
              type: 'integer',
            },
            folder_id: {
              type: ['integer', 'null'],
            },
            created_by: {
              type: 'string',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Folder: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
            },
            name: {
              type: 'string',
            },
            parent_id: {
              type: ['integer', 'null'],
            },
            created_by: {
              type: 'string',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        File: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
            },
            name: {
              type: 'string',
            },
            type: {
              type: 'string',
              enum: ['folder', 'document'],
            },
            size: {
              type: ['integer', 'null'],
            },
            folder_id: {
              type: ['integer', 'null'],
            },
            created_by: {
              type: 'string',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
            },
            limit: {
              type: 'integer',
            },
            total: {
              type: 'integer',
            },
            totalPages: {
              type: 'integer',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['error'],
            },
            message: {
              type: 'string',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
      },
      responses: {
        DocumentResponse: {
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
