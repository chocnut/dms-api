import { Kysely } from 'kysely'
import { Database } from '../schema'
import { db as defaultDb } from '../config'

const documentTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]

const fileNames = [
  'report',
  'document',
  'presentation',
  'spreadsheet',
  'image',
  'contract',
  'invoice',
  'proposal',
  'meeting_notes',
  'budget',
  'analysis',
  'summary',
  'plan',
  'review',
  'checklist',
]

const folderNames = [
  'Marketing',
  'Finance',
  'HR',
  'Projects',
  'Legal',
  'Sales',
  'Research',
  'Development',
  'Operations',
  'Client Files',
  'IT',
  'Administration',
  'Executive',
  'Training',
  'Quality Assurance',
]

const subfolderNames = [
  'Archive',
  'Templates',
  'Reports',
  'Meetings',
  'Drafts',
  'Final',
  'Resources',
  'Documents',
  'Shared',
  'Confidential',
  'Team',
  'Planning',
  'Reviews',
  'Backups',
  'External',
]

const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)]
}

const generateRandomDocument = (folderId: number | null = null) => {
  const type = getRandomElement(documentTypes)
  const extension = type.split('/')[1]
  const baseName = getRandomElement(fileNames)
  const randomNumber = Math.floor(Math.random() * 1000)
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * 365))

  return {
    name: `${baseName}_${randomNumber}.${extension}`,
    type,
    size: Math.floor(Math.random() * (10485760 - 1024 + 1)) + 1024,
    created_by: 'John Green',
    created_at: date,
    folder_id: folderId,
  }
}

const createFolder = async (db: Kysely<Database>, name: string, parentId: number | null = null) => {
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * 365))

  const [folder] = await db
    .insertInto('folders')
    .values({
      name,
      parent_id: parentId,
      created_by: 'John Green',
      created_at: date,
    })
    .returning('id')
    .execute()

  return folder.id
}

const generateSubfolderStructure = async (
  db: Kysely<Database>,
  parentId: number,
  depth: number = 0,
  usedNames: Set<string> = new Set()
) => {
  if (depth >= 3) return

  const numSubfolders = Math.floor(Math.random() * 4) + 3
  const numDocuments = Math.floor(Math.random() * 11) + 10

  for (let i = 0; i < numSubfolders; i++) {
    let subfolderName = getRandomElement(subfolderNames)
    while (usedNames.has(subfolderName)) {
      subfolderName = getRandomElement(subfolderNames)
    }
    usedNames.add(subfolderName)

    const folderId = await createFolder(db, subfolderName, parentId)

    for (let j = 0; j < numDocuments; j++) {
      await db.insertInto('documents').values(generateRandomDocument(folderId)).execute()
    }

    if (Math.random() < 0.7) {
      await generateSubfolderStructure(db, folderId, depth + 1, new Set(usedNames))
    }
  }
}

export async function seed(db: Kysely<Database> = defaultDb) {
  await db.deleteFrom('documents').execute()
  await db.deleteFrom('folders').execute()

  const rootUsedNames = new Set<string>()
  const numRootFolders = folderNames.length
  const numRootDocuments = Math.floor(Math.random() * 11) + 25

  for (let i = 0; i < numRootFolders; i++) {
    let folderName = getRandomElement(folderNames)
    while (rootUsedNames.has(folderName)) {
      folderName = getRandomElement(folderNames)
    }
    rootUsedNames.add(folderName)

    const folderId = await createFolder(db, folderName)

    const numDocuments = Math.floor(Math.random() * 11) + 15
    for (let j = 0; j < numDocuments; j++) {
      await db.insertInto('documents').values(generateRandomDocument(folderId)).execute()
    }

    await generateSubfolderStructure(db, folderId)
  }

  for (let i = 0; i < numRootDocuments; i++) {
    await db.insertInto('documents').values(generateRandomDocument(null)).execute()
  }
}

export async function down(db: Kysely<Database>) {
  await db.deleteFrom('documents').execute()
  await db.deleteFrom('folders').execute()
}
