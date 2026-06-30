import { useMutation } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import type { AppSettings, Priority, PrioritySuggestionResult } from '../../domain'
import { useMembers } from '../members'
import { useProject } from '../projects'
import { useSettings } from '../settings'
import { useSubtasksByTask } from '../subtasks'
import { useTags } from '../tags'
import { useTask, useTasksByProject, useUpdateTask } from '../tasks'
import { useAIProviderResolver } from './ai-provider-resolver-context'
import { createPrioritySuggestionUseCases, type PrioritySuggestionConfigurationState } from './priority-suggestion-use-cases'
import { PrioritySuggestionInputError } from './priority-suggestion-input'

export type PrioritySuggestionGenerationError = {
  kind: 'provider' | 'validation' | 'missing_context'
  message: string
}

export type PrioritySuggestionApplyResult =
  | {
      status: 'updated'
      suggestedPriority: Priority
    }
  | {
      status: 'same_priority'
      suggestedPriority: Priority
    }
  | {
      status: 'missing_context'
      message: string
    }
  | {
      status: 'busy'
      message: string
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

const toGenerationError = (error: unknown): PrioritySuggestionGenerationError => {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : null
  const message = error instanceof Error ? error.message : 'Unable to generate a priority suggestion right now.'

  if (error instanceof PrioritySuggestionInputError || code === 'invalid_response') {
    return {
      kind: 'validation',
      message:
        error instanceof PrioritySuggestionInputError
          ? error.message
          : 'The AI priority suggestion returned data in an invalid format. Generate again.',
    }
  }

  if (
    message.includes('unavailable') ||
    message.includes('still loading') ||
    message.includes('Loading AI configuration') ||
    message.includes('Select a Groq model') ||
    message.includes('Add a Groq API key')
  ) {
    return {
      kind: 'missing_context',
      message,
    }
  }

  return {
    kind: 'provider',
    message,
  }
}

const toApplyMissingContextResult = (): PrioritySuggestionApplyResult => ({
  status: 'missing_context',
  message: 'The selected task context is unavailable.',
})

export const useAIPrioritySuggestion = (projectId: string | undefined, taskId: string | undefined) => {
  const resolver = useAIProviderResolver()
  const { data: settings } = useSettings()
  const { data: project } = useProject(projectId)
  const { data: task } = useTask(taskId)
  const { data: tasks = [] } = useTasksByProject(projectId)
  const { data: subtasks = [] } = useSubtasksByTask(taskId)
  const { data: tags = [] } = useTags()
  const { data: members = [] } = useMembers()
  const updateTask = useUpdateTask()
  const [suggestion, setSuggestion] = useState<PrioritySuggestionResult | null>(null)
  const [generationError, setGenerationError] = useState<PrioritySuggestionGenerationError | null>(null)
  const [instructions, setInstructions] = useState('')
  const [isApplyingSuggestion, setIsApplyingSuggestion] = useState(false)
  const isApplyInProgressRef = useRef(false)

  const configurationState = getPrioritySuggestionConfigurationState(settings)

  const generationMutation = useMutation({
    mutationFn: async (additionalInstructions?: string) => {
      if (projectId === undefined || project === null || project === undefined) {
        throw new Error('The current project is unavailable.')
      }

      if (taskId === undefined || task === null || task === undefined) {
        throw new Error('The selected task is unavailable.')
      }

      if (settings === undefined) {
        throw new Error('AI configuration is still loading.')
      }

      if (!configurationState.isConfigured) {
        throw new Error(configurationState.message)
      }

      const useCases = createPrioritySuggestionUseCases(
        {
          get: async () => settings,
          save: async (value) => value,
          reset: async () => settings,
        },
        resolver,
      )

      return useCases.generatePrioritySuggestion({
        additionalInstructions,
        members,
        project,
        subtasks,
        tags,
        task,
        tasks,
      })
    },
    onMutate: () => {
      setGenerationError(null)
      setSuggestion(null)
    },
    onSuccess: (result) => {
      setSuggestion(result)
    },
    onError: (error) => {
      setSuggestion(null)
      setGenerationError(toGenerationError(error))
    },
  })

  const applyMutation = useMutation({
    mutationFn: async (): Promise<PrioritySuggestionApplyResult> => {
      if (isApplyInProgressRef.current) {
        return {
          status: 'busy',
          message: 'Priority update is already in progress.',
        }
      }

      isApplyInProgressRef.current = true
      setIsApplyingSuggestion(true)

      try {
        if (project === null || project === undefined || task === null || task === undefined || suggestion === null) {
          return toApplyMissingContextResult()
        }

        if (suggestion.suggestedPriority === task.priority) {
          return {
            status: 'same_priority',
            suggestedPriority: suggestion.suggestedPriority,
          }
        }

        await updateTask.mutateAsync({
          projectId: project.id,
          taskId: task.id,
          input: {
            priority: suggestion.suggestedPriority,
          },
        })

        return {
          status: 'updated',
          suggestedPriority: suggestion.suggestedPriority,
        }
      } finally {
        isApplyInProgressRef.current = false
        setIsApplyingSuggestion(false)
      }
    },
    onSuccess: (result) => {
      if (result.status === 'updated') {
        setSuggestion(null)
      }
    },
  })

  const generate = async (additionalInstructions?: string): Promise<void> => {
    await generationMutation.mutateAsync(additionalInstructions)
  }

  const applySuggestion = async (): Promise<PrioritySuggestionApplyResult> => applyMutation.mutateAsync()

  const clearReview = (): void => {
    setSuggestion(null)
    setGenerationError(null)
  }

  return {
    applySuggestion,
    clearReview,
    configurationState,
    currentSuggestion: suggestion,
    generationError,
    generate,
    instructions,
    isApplying: applyMutation.isPending || updateTask.isPending || isApplyingSuggestion,
    isGenerating: generationMutation.isPending,
    project,
    task,
    setInstructions,
  }
}
