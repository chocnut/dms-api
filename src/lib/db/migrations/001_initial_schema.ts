import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable('folders')
    .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
    .addColumn('name', 'varchar(255)', col => col.notNull())
    .addColumn('parent_id', 'integer', col => col.references('folders.id').onDelete('cascade'))
    .addColumn('created_by', 'varchar(255)', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.defaultTo('CURRENT_TIMESTAMP').notNull())
    .addColumn('updated_at', 'timestamp', col => col.defaultTo(sql`now()`).notNull())
    .execute()

  await db.schema
    .createTable('documents')
    .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
    .addColumn('name', 'varchar(255)', col => col.notNull())
    .addColumn('type', 'varchar(100)', col => col.notNull())
    .addColumn('size', 'integer', col => col.notNull())
    .addColumn('folder_id', 'integer', col => col.references('folders.id').onDelete('cascade'))
    .addColumn('created_by', 'varchar(255)', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.defaultTo('CURRENT_TIMESTAMP').notNull())
    .addColumn('updated_at', 'timestamp', col => col.defaultTo(sql`now()`).notNull())
    .execute()
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable('documents').execute()
  await db.schema.dropTable('folders').execute()
}
