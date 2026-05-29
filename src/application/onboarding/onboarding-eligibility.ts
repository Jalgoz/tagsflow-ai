import type { LocalBackupData } from '../../domain'

export interface FirstLaunchEligibilityInput {
  hasBusinessData: boolean
  onboardingCompleted: boolean
}

export const hasLocalBusinessData = (database: Pick<LocalBackupData, 'projects' | 'tasks' | 'subtasks' | 'members' | 'tags'>): boolean =>
  database.projects.length > 0 ||
  database.tasks.length > 0 ||
  database.subtasks.length > 0 ||
  database.members.length > 0 ||
  database.tags.length > 0

export const isFirstLaunchOnboardingEligible = ({
  hasBusinessData,
  onboardingCompleted,
}: FirstLaunchEligibilityInput): boolean => !hasBusinessData && !onboardingCompleted
