import type { AppSettings, Member, Project, SettingsRepository, Subtask, Tag, Task } from '../../domain'
import { buildPrioritySuggestionRequest } from './priority-suggestion-input'
import type { AIProviderResolver, ResolveAIProviderOptions } from './ai-provider-resolver'

export type PrioritySuggestionConfigurationState =
  | {
      isConfigured: true
    }
  | {
      actionLabel: string
      isConfigured: false
      message: string
    }

export type PrioritySuggestionGenerationInput = {
  additionalInstructions?: string
  members: Member[]
  project: Project
  subtasks: Subtask[]
  tags: Tag[]
  task: Task
  tasks: Task[]
}

const hasNonEmptyValue = (value: string | null): boolean => value !== null && value.trim().length > 0

const getPrioritySuggestionConfigurationState = (
  settings: AppSettings | undefined,
): PrioritySuggestionConfigurationState => {
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
      message: 'Add a Groq API key in Settings before generating AI priority suggestions.',
      actionLabel: 'Configure AI',
    }
  }

  if (!hasNonEmptyValue(settings.aiProvider.selectedModelId)) {
    return {
      isConfigured: false,
      message: 'Select a Groq model in Settings before generating AI priority suggestions.',
      actionLabel: 'Select Model',
    }
  }

  return {
    isConfigured: true,
  }
}

export const createPrioritySuggestionUseCases = (
  settingsRepository: SettingsRepository,
  providerResolver: AIProviderResolver,
) => ({
  getConfigurationState: async (): Promise<PrioritySuggestionConfigurationState> =>
    getPrioritySuggestionConfigurationState(await settingsRepository.get()),
  generatePrioritySuggestion: async (
    input: PrioritySuggestionGenerationInput,
    options: ResolveAIProviderOptions = {},
  ) => {
    const settings = await settingsRepository.get()
    const configurationState = getPrioritySuggestionConfigurationState(settings)

    if (!configurationState.isConfigured) {
      throw new Error(configurationState.message)
    }

    const resolution = providerResolver.resolve(settings, options)

    if (!resolution.isConfigured) {
      throw resolution.error
    }

    const request = buildPrioritySuggestionRequest({
      additionalInstructions: input.additionalInstructions,
      members: input.members,
      project: input.project,
      subtasks: input.subtasks,
      tags: input.tags,
      task: input.task,
      tasks: input.tasks,
    })

    return resolution.provider.suggestPriority(request)
  },
})

export type { PrioritySuggestionInputError } from './priority-suggestion-input'
