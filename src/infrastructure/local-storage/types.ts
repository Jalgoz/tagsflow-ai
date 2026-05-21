import type { AppSettings, Member, Project, Subtask, Tag, Task } from '../../domain'

export const LOCAL_DATABASE_VERSION = 1

export type LocalDatabaseVersion = typeof LOCAL_DATABASE_VERSION

export interface LocalDatabase {
  version: LocalDatabaseVersion
  projects: Project[]
  tasks: Task[]
  subtasks: Subtask[]
  members: Member[]
  tags: Tag[]
  settings: AppSettings
}

export interface LocalStorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface LocalDatabaseValidationResult {
  database: LocalDatabase
  recovered: boolean
}
