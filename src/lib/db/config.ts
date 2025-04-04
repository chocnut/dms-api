import { Kysely, MysqlDialect } from 'kysely'
import mysql from 'mysql2'
import { Database } from './schema'

export function createKysely() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'document_management',
  })

  return new Kysely<Database>({
    dialect: new MysqlDialect({
      pool,
    }),
  })
}

export const db = createKysely()
