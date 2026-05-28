import type { Member } from './member'
import type { Project } from './project'
import type { AppSettings, ExportableAppSettings } from './settings'
import type { Subtask } from './subtask'
import type { Tag } from './tag'
import type { Task } from './task'

export interface LocalBackupData {
  version: number
  projects: Project[]
  tasks: Task[]
  subtasks: Subtask[]
  members: Member[]
  tags: Tag[]
  settings: ExportableAppSettings
}

export interface ValidatedLocalBackupData {
  version: number
  projects: Project[]
  tasks: Task[]
  subtasks: Subtask[]
  members: Member[]
  tags: Tag[]
  settings: AppSettings
}

export type LocalBackupValidationErrorCode = 'malformed_json' | 'unsupported_version' | 'invalid_shape'

export type LocalBackupValidationResult =
  | {
      success: true
      database: ValidatedLocalBackupData
    }
  | {
      success: false
      code: LocalBackupValidationErrorCode
      message: string
      details: string[]
    }
