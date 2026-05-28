import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { AppSettings, ThemeMode, ValidatedLocalBackupData } from '../../domain'
import { createLocalBackupUseCases, createSettingsUseCases } from './settings-use-cases'
import { useLocalBackupRepository } from './local-backup-repository-context'
import { settingsQueryKeys } from './settings-query-keys'
import { useSettingsRepository } from './settings-repository-context'

const invalidateAllAppDataQueries = async (queryClient: QueryClient) => {
  await queryClient.invalidateQueries()
}

export const useSettings = () => {
  const repository = useSettingsRepository()

  return useQuery({
    queryKey: settingsQueryKeys.current(),
    queryFn: () => createSettingsUseCases(repository).getSettings(),
  })
}

export const useSaveTheme = () => {
  const repository = useSettingsRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (theme: ThemeMode) => createSettingsUseCases(repository).updateTheme(theme),
    onSuccess: async (savedSettings) => {
      queryClient.setQueryData<AppSettings>(settingsQueryKeys.current(), savedSettings)
      await invalidateAllAppDataQueries(queryClient)
    },
  })
}

export const useResetSettings = () => {
  const repository = useSettingsRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => createSettingsUseCases(repository).resetSettings(),
    onSuccess: async (savedSettings) => {
      queryClient.setQueryData<AppSettings>(settingsQueryKeys.current(), savedSettings)
      await invalidateAllAppDataQueries(queryClient)
    },
  })
}

export const useExportLocalBackup = () => {
  const repository = useLocalBackupRepository()

  return useMutation({
    mutationFn: async () => createLocalBackupUseCases(repository).exportBackup(),
  })
}

export const useValidateLocalBackupImport = () => {
  const repository = useLocalBackupRepository()

  return useMutation({
    mutationFn: async (jsonText: string) => createLocalBackupUseCases(repository).validateImport(jsonText),
  })
}

export const useReplaceLocalBackup = () => {
  const repository = useLocalBackupRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (database: ValidatedLocalBackupData) =>
      createLocalBackupUseCases(repository).replaceWithValidatedImport(database),
    onSuccess: async () => {
      await invalidateAllAppDataQueries(queryClient)
    },
  })
}

export const useResetLocalData = () => {
  const repository = useLocalBackupRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => createLocalBackupUseCases(repository).resetLocalData(),
    onSuccess: async () => {
      await invalidateAllAppDataQueries(queryClient)
    },
  })
}
