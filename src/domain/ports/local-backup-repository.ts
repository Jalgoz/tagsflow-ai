import type { LocalBackupData, LocalBackupValidationResult, ValidatedLocalBackupData } from '../entities'

export interface LocalBackupRepository {
  exportBackup(): Promise<LocalBackupData>
  validateImport(jsonText: string): Promise<LocalBackupValidationResult>
  replaceWithValidatedImport(database: ValidatedLocalBackupData): Promise<void>
  resetLocalData(): Promise<void>
}
