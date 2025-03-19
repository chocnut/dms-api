import { Kysely } from 'kysely'
import { Database } from '../schema'
import { db as defaultDb } from '../config'
import { CreateDocumentDTO } from '../../../repositories/documentRepository'
import { InsertObject } from 'kysely'

const BATCH_SIZE = 100

const documentTypes = ['application/pdf', 'application/msword', 'image/jpeg', 'image/png']

const fileNames = ['document', 'spreadsheet', 'image', 'invoice']

const folderNames = ['Marketing', 'Finance', 'HR', 'Projects']

const subfolderNames = ['Archive', 'Templates', 'Reports', 'Meetings']

const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)]
}

interface FolderData {
  name: string
  parent_id: number | null
  created_by: string
  created_at: Date
}

interface DocumentData extends CreateDocumentDTO {
  created_at: Date
}

const generateRandomDocument = (folderId: number | null = null): DocumentData => {
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
    folder_id: folderId,
    created_at: date,
  }
}

const createFolders = async (
  db: Kysely<Database>,
  folders: Array<Omit<FolderData, 'created_by'>>
) => {
  if (folders.length === 0) return []

  const [result] = await db
    .insertInto('folders')
    .values(
      folders.map(f => ({
        name: f.name,
        parent_id: f.parent_id,
        created_by: 'John Green',
        created_at: f.created_at,
      })) satisfies InsertObject<Database, 'folders'>[]
    )
    .execute()

  const startId = Number(result.insertId)
  return Array.from({ length: folders.length }, (_, i) => startId + i)
}

const insertDocumentsBatch = async (db: Kysely<Database>, documents: DocumentData[]) => {
  if (documents.length === 0) return

  const batches = []
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    batches.push(documents.slice(i, i + BATCH_SIZE))
  }

  for (const batch of batches) {
    await db
      .insertInto('documents')
      .values(batch satisfies InsertObject<Database, 'documents'>[])
      .execute()
  }
}

const generateSubfolderStructure = async (
  db: Kysely<Database>,
  parentIds: number[],
  depth: number = 0,
  usedNames: Set<string> = new Set()
) => {
  if (depth >= 1 || parentIds.length === 0) return

  console.log(`Generating level ${depth + 1} subfolders for ${parentIds.length} parent folders...`)
  const subfolders: Array<Omit<FolderData, 'created_by'>> = []
  const documents: DocumentData[] = []

  for (const parentId of parentIds) {
    const numSubfolders = 1
    const numDocuments = 2

    for (let i = 0; i < numSubfolders; i++) {
      let subfolderName = getRandomElement(subfolderNames)
      while (usedNames.has(subfolderName)) {
        subfolderName = getRandomElement(subfolderNames)
      }
      usedNames.add(subfolderName)

      const date = new Date()
      date.setDate(date.getDate() - Math.floor(Math.random() * 365))
      subfolders.push({ name: subfolderName, parent_id: parentId, created_at: date })
    }

    for (let j = 0; j < numDocuments; j++) {
      documents.push(generateRandomDocument(parentId))
    }
  }

  if (subfolders.length > 0) {
    console.log(`Creating ${subfolders.length} subfolders at level ${depth + 1}...`)
    await createFolders(db, subfolders)

    if (documents.length > 0) {
      console.log(`Creating ${documents.length} documents for level ${depth + 1} folders...`)
      await insertDocumentsBatch(db, documents)
    }
  }
}

export async function seed(db: Kysely<Database> = defaultDb) {
  console.log('Cleaning up existing data...')
  await db.deleteFrom('documents').execute()
  await db.deleteFrom('folders').execute()

  console.log('Creating root folders...')
  const rootFolders: Array<Omit<FolderData, 'created_by'>> = []
  const rootDocuments: DocumentData[] = []
  const rootUsedNames = new Set<string>()
  const numRootDocuments = 5

  for (let i = 0; i < folderNames.length; i++) {
    let folderName = getRandomElement(folderNames)
    while (rootUsedNames.has(folderName)) {
      folderName = getRandomElement(folderNames)
    }
    rootUsedNames.add(folderName)

    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * 365))
    rootFolders.push({ name: folderName, parent_id: null, created_at: date })

    const numDocuments = 2
    for (let j = 0; j < numDocuments; j++) {
      rootDocuments.push(generateRandomDocument(null))
    }
  }

  console.log(`Creating ${rootFolders.length} root folders...`)
  const rootFolderIds = await createFolders(db, rootFolders)

  console.log(`Creating ${rootDocuments.length} root documents...`)
  const documentsWithFolders = rootDocuments.map((doc, index) => {
    const folderId =
      rootFolderIds[Math.floor(index / (rootDocuments.length / rootFolderIds.length || 1))]
    return {
      ...doc,
      folder_id: folderId,
    } as DocumentData
  })

  for (let i = 0; i < numRootDocuments; i++) {
    documentsWithFolders.push(generateRandomDocument(null))
  }

  if (documentsWithFolders.length > 0) {
    console.log(`Inserting ${documentsWithFolders.length} root documents...`)
    await insertDocumentsBatch(db, documentsWithFolders)
  }

  console.log('Generating subfolder structure...')
  await generateSubfolderStructure(db, rootFolderIds)

  console.log('Seeding completed successfully!')
}

export async function down(db: Kysely<Database>) {
  await db.deleteFrom('documents').execute()
  await db.deleteFrom('folders').execute()
}
