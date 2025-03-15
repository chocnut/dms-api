import { Generated, GeneratedAlways } from 'kysely'

export interface Database {
  documents: DocumentTable
  folders: FolderTable
}

export interface DocumentTable {
  id: GeneratedAlways<number>
  name: string
  type: string
  size: number
  folder_id: number | null
  created_by: string
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export interface FolderTable {
  id: GeneratedAlways<number>
  name: string
  parent_id: number | null
  created_by: string
  created_at: Generated<Date>
  updated_at: Generated<Date>
}
