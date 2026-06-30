import type { AppSettings, Member, Project, ProjectSummaryResult, SettingsRepository, Subtask, Tag, Task } from '../../domain'
import type { AIProviderResolver, ResolveAIProviderOptions } from './ai-provider-resolver'
import { buildProjectSummaryRequest, ProjectSummaryInputError } from './project-summary-input'

export type ProjectSummaryConfigurationState =
  | {
      isConfigured: true
    }
  | {
      actionLabel: string
      isConfigured: false
      message: string
    }

export type ProjectSummaryGenerationInput = {
  additionalInstructions?: string
  members: Member[]
  project: Project
  referenceDate: string
  subtasks: Subtask[]
  tags: Tag[]
  tasks: Task[]
}

const hasNonEmptyValue = (value: string | null): boolean => value !== null && value.trim().length > 0

export const getProjectSummaryConfigurationState = (
  settings: AppSettings | undefined,
): ProjectSummaryConfigurationState => {
  if (settings === undefined) {
    return {
      isConfigured: false,
      message: 'Loading AI configuration...',
      actionLabel: 'Open Settings',
    }
  }

  if (!hasNonEmptyValue(settings.aiProvider.apiKey)) {
    return {
      isConfigured: false,
      message: 'Add a Groq API key in Settings before generating an AI project summary.',
      actionLabel: 'Configure AI',
    }
  }

  if (!hasNonEmptyValue(settings.aiProvider.selectedModelId)) {
    return {
      isConfigured: false,
      message: 'Select a Groq model in Settings before generating an AI project summary.',
      actionLabel: 'Select Model',
    }
  }

  return {
    isConfigured: true,
  }
}

export const createProjectSummaryUseCases = (
  settingsRepository: SettingsRepository,
  providerResolver: AIProviderResolver,
) => ({
  getConfigurationState: async (): Promise<ProjectSummaryConfigurationState> =>
    getProjectSummaryConfigurationState(await settingsRepository.get()),
  generateProjectSummary: async (
    input: ProjectSummaryGenerationInput,
    options: ResolveAIProviderOptions = {},
  ): Promise<ProjectSummaryResult> => {
    const settings = await settingsRepository.get()
    const configurationState = getProjectSummaryConfigurationState(settings)

    if (!configurationState.isConfigured) {
      throw new Error(configurationState.message)
    }

    const resolution = providerResolver.resolve(settings, options)

    if (!resolution.isConfigured) {
      throw resolution.error
    }

    const request = buildProjectSummaryRequest({
      project: input.project,
      tasks: input.tasks,
      subtasks: input.subtasks,
      tags: input.tags,
      members: input.members,
      instructions: input.additionalInstructions,
      referenceDate: input.referenceDate,
    })

    return resolution.provider.summarizeProject(request)
  },
})

export { ProjectSummaryInputError }
