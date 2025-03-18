import { Kysely } from 'kysely'
import { Database } from '../schema'

export async function seed(db: Kysely<Database>) {
  try {
    console.log('Cleaning up existing data...')
    await db.deleteFrom('documents').execute()
    await db.deleteFrom('folders').execute()

    console.log('Starting seed process...')

    await db
      .insertInto('folders')
      .values([
        {
          name: 'Appointment resolutions',
          parent_id: null,
          created_by: 'John Green',
        },
        {
          name: 'Policy approvals',
          parent_id: null,
          created_by: 'John Green',
        },
      ])
      .execute()

    const appointmentFolder = await db
      .selectFrom('folders')
      .select('id')
      .where('name', '=', 'Appointment resolutions')
      .executeTakeFirst()

    if (!appointmentFolder?.id) {
      throw new Error('Failed to create appointment folder')
    }

    await db
      .insertInto('documents')
      .values([
        {
          name: '2025_01_15_Director_Appointment_Resolution.pdf',
          type: 'application/pdf',
          size: 1024,
          created_by: 'John Green',
          created_at: new Date('2024-04-12'),
        },
        {
          name: '2024_12_10_Dividend_Declaration_Resolution.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 1024,
          created_by: 'John Green',
          created_at: new Date('2024-04-12'),
        },
        {
          name: '2023_08_06_Investment_Policy_Approval.pdf',
          type: 'application/pdf',
          size: 1024,
          created_by: 'John Green',
          created_at: new Date('2024-04-12'),
        },
      ])
      .execute()
    console.log('Seed completed successfully')
  } catch (error) {
    console.error('Error in seed:', error)
    throw error
  }
}

export async function down(db: Kysely<Database>) {
  await db.deleteFrom('documents').execute()
  await db.deleteFrom('folders').execute()
}
