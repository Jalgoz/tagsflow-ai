import type { LocalBackupRepository, SettingsRepository } from '../../domain'
import { buildDemoLocalBackupData } from './demo-data-factory'
import { hasLocalBusinessData, isFirstLaunchOnboardingEligible } from './onboarding-eligibility'
import type { OnboardingStateRepository } from './onboarding-state-repository'

export interface OnboardingStatus {
  hasBusinessData: boolean
  onboardingCompleted: boolean
  shouldShowOnboarding: boolean
}

const getOnboardingStatus = async (
  backupRepository: LocalBackupRepository,
  onboardingStateRepository: OnboardingStateRepository,
): Promise<OnboardingStatus> => {
  const [backupData, onboardingState] = await Promise.all([
    backupRepository.exportBackup(),
    onboardingStateRepository.getState(),
  ])

  const hasBusinessData = hasLocalBusinessData(backupData)
  const onboardingCompleted = onboardingState.completed

  return {
    hasBusinessData,
    onboardingCompleted,
    shouldShowOnboarding: isFirstLaunchOnboardingEligible({
      hasBusinessData,
      onboardingCompleted,
    }),
  }
}

export const createOnboardingUseCases = (
  backupRepository: LocalBackupRepository,
  settingsRepository: SettingsRepository,
  onboardingStateRepository: OnboardingStateRepository,
) => ({
  getStatus: async (): Promise<OnboardingStatus> => getOnboardingStatus(backupRepository, onboardingStateRepository),
  startEmpty: async (): Promise<void> => {
    await onboardingStateRepository.markCompleted()
  },
  loadDemoData: async (referenceDate = new Date()): Promise<void> => {
    const settings = await settingsRepository.get()
    const demoData = buildDemoLocalBackupData({
      referenceDate,
      settings,
    })

    await backupRepository.replaceWithValidatedImport(demoData)
    await onboardingStateRepository.markCompleted()
  },
  clearCompletionWhenBusinessDataIsEmpty: async (): Promise<void> => {
    const status = await getOnboardingStatus(backupRepository, onboardingStateRepository)

    if (!status.hasBusinessData) {
      await onboardingStateRepository.clear()
    }
  },
})
