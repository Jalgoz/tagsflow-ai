import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { createLocalBackupUseCases, useLocalBackupRepository, useSettingsRepository } from '../settings'
import { useOnboardingStateRepository } from './onboarding-state-context'
import { onboardingQueryKeys } from './onboarding-query-keys'
import { createOnboardingUseCases } from './onboarding-use-cases'

const invalidateAllAppDataQueries = async (queryClient: QueryClient) => {
  await queryClient.invalidateQueries()
}

export const useOnboardingStatus = () => {
  const backupRepository = useLocalBackupRepository()
  const settingsRepository = useSettingsRepository()
  const onboardingStateRepository = useOnboardingStateRepository()

  return useQuery({
    queryKey: onboardingQueryKeys.status(),
    queryFn: () => createOnboardingUseCases(backupRepository, settingsRepository, onboardingStateRepository).getStatus(),
  })
}

export const useStartEmptyOnboarding = () => {
  const backupRepository = useLocalBackupRepository()
  const settingsRepository = useSettingsRepository()
  const onboardingStateRepository = useOnboardingStateRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () =>
      createOnboardingUseCases(backupRepository, settingsRepository, onboardingStateRepository).startEmpty(),
    onSuccess: async () => {
      await invalidateAllAppDataQueries(queryClient)
    },
  })
}

export const useLoadDemoData = () => {
  const backupRepository = useLocalBackupRepository()
  const settingsRepository = useSettingsRepository()
  const onboardingStateRepository = useOnboardingStateRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () =>
      createOnboardingUseCases(backupRepository, settingsRepository, onboardingStateRepository).loadDemoData(),
    onSuccess: async () => {
      await invalidateAllAppDataQueries(queryClient)
    },
  })
}

export const useResetLocalDataWithOnboarding = () => {
  const backupRepository = useLocalBackupRepository()
  const settingsRepository = useSettingsRepository()
  const onboardingStateRepository = useOnboardingStateRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await createLocalBackupUseCases(backupRepository).resetLocalData()
      await createOnboardingUseCases(
        backupRepository,
        settingsRepository,
        onboardingStateRepository,
      ).clearCompletionWhenBusinessDataIsEmpty()
    },
    onSuccess: async () => {
      await invalidateAllAppDataQueries(queryClient)
    },
  })
}
