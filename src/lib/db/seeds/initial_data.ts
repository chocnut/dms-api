import { Kysely } from 'kysely'
import { Database } from '../schema'

export async function seed(db: Kysely<Database>) {
  const [appointmentFolder] = await db
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
    .returning('id')
    .execute()

  await db
    .insertInto('documents')
    .values([
      {
        name: '2025_01_15_Director_Appointment_Resolution.pdf',
        type: 'application/pdf',
        size: 1024,
        folder_id: appointmentFolder.id,
        created_by: 'John Green',
        created_at: new Date('2024-04-12'),
      },
      {
        name: '2024_12_10_Dividend_Declaration_Resolution.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 1024,
        folder_id: appointmentFolder.id,
        created_by: 'John Green',
        created_at: new Date('2024-04-12'),
      },
      {
        name: '2023_08_06_Investment_Policy_Approval.pdf',
        type: 'application/pdf',
        size: 1024,
        folder_id: appointmentFolder.id,
        created_by: 'John Green',
        created_at: new Date('2024-04-12'),
      },
    ])
    .execute()
}

export async function down(db: Kysely<Database>) {
  await db.deleteFrom('documents').execute()
  await db.deleteFrom('folders').execute()
}
