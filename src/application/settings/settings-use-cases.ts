import type {
  AppSettings,
  LocalBackupData,
  LocalBackupRepository,
  LocalBackupValidationResult,
  SettingsRepository,
  ThemeMode,
  ValidatedLocalBackupData,
} from '../../domain'

export const createSettingsUseCases = (settingsRepository: SettingsRepository) => ({
  getSettings: async (): Promise<AppSettings> => settingsRepository.get(),
  saveSettings: async (settings: AppSettings): Promise<AppSettings> => settingsRepository.save(settings),
  updateTheme: async (theme: ThemeMode): Promise<AppSettings> => {
    const currentSettings = await settingsRepository.get()

    return settingsRepository.save({
      ...currentSettings,
      theme,
    })
  },
  resetSettings: async (): Promise<AppSettings> => settingsRepository.reset(),
})

export const createLocalBackupUseCases = (backupRepository: LocalBackupRepository) => ({
  exportBackup: async (): Promise<LocalBackupData> => backupRepository.exportBackup(),
  validateImport: async (jsonText: string): Promise<LocalBackupValidationResult> => backupRepository.validateImport(jsonText),
  replaceWithValidatedImport: async (database: ValidatedLocalBackupData): Promise<void> =>
    backupRepository.replaceWithValidatedImport(database),
  resetLocalData: async (): Promise<void> => backupRepository.resetLocalData(),
})
