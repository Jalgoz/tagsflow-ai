import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import type { AppSettings } from '../../domain'
import { buildSubtaskGenerationRequest } from './subtask-generator-input'
import {
  createSubtaskGeneratorDrafts,
  toCreateSubtaskInputFromSubtaskGeneratorDraft,
  updateSubtaskGeneratorDraftField,
  validateSubtaskGeneratorDraft,
  type SubtaskGeneratorDraft,
  type SubtaskGeneratorDraftInput,
} from './subtask-generator-drafts'
import { useProject } from '../projects'
import { useSettings } from '../settings'
import { useTask } from '../tasks'
import { useCreateSubtask, useSubtasksByTask } from '../subtasks'
import { useMembers } from '../members'
import { useTags } from '../tags'
import { useAIProviderResolver } from './ai-provider-resolver-context'

export type SubtaskGeneratorError = {
  kind: 'provider' | 'validation'
  message: string
}

export type SubtaskGeneratorConfigurationState =
  | {
      isConfigured: true
    }
  | {
      actionLabel: string
      isConfigured: false
      message: string
    }

export type SubtaskGeneratorInsertResult =
  | {
      invalidDraftIds: string[]
      status: 'validation_error'
    }
  | {
      status: 'empty_selection'
    }
  | {
      failureCount: number
      failedDraftTitles: string[]
      status: 'completed'
      successCount: number
    }

const hasNonEmptyValue = (value: string | null): boolean => value !== null && value.trim().length > 0

const getSubtaskGeneratorConfigurationState = (
  settings: AppSettings | undefined,
): SubtaskGeneratorConfigurationState => {
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
      message: 'Add a Groq API key in Settings before generating AI subtasks.',
      actionLabel: 'Configure AI',
    }
  }

  if (!hasNonEmptyValue(settings.aiProvider.selectedModelId)) {
    return {
      isConfigured: false,
      message: 'Select a Groq model in Settings before generating AI subtasks.',
      actionLabel: 'Select Model',
    }
  }

  return {
    isConfigured: true,
  }
}

const toGenerationError = (error: unknown): SubtaskGeneratorError => {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : null
  const message = error instanceof Error ? error.message : 'Unable to generate subtasks right now.'

  if (code === 'invalid_response') {
    return {
      kind: 'validation',
      message: 'The AI subtask generator returned data in an invalid format. Generate again.',
    }
  }

  return {
    kind: 'provider',
    message,
  }
}

export const useAISubtaskGenerator = (projectId: string | undefined, taskId: string | undefined) => {
  const resolver = useAIProviderResolver()
  const { data: settings } = useSettings()
  const { data: project } = useProject(projectId)
  const { data: task } = useTask(taskId)
  const { data: subtasks = [] } = useSubtasksByTask(taskId)
  const { data: tags = [] } = useTags()
  const { data: members = [] } = useMembers()
  const createSubtask = useCreateSubtask()
  const [drafts, setDrafts] = useState<SubtaskGeneratorDraft[]>([])
  const [generationError, setGenerationError] = useState<SubtaskGeneratorError | null>(null)
  const [reviewMessage, setReviewMessage] = useState<string | null>(null)

  const configurationState = getSubtaskGeneratorConfigurationState(settings)

  const generateMutation = useMutation({
    mutationFn: async (instructions?: string) => {
      if (projectId === undefined || project === null || project === undefined) {
        throw new Error('The current project is unavailable.')
      }

      if (taskId === undefined || task === null || task === undefined) {
        throw new Error('The parent task is unavailable.')
      }

      if (settings === undefined) {
        throw new Error('AI configuration is still loading.')
      }

      if (!configurationState.isConfigured) {
        throw new Error(configurationState.message)
      }

      const resolution = resolver.resolve(settings)

      if (!resolution.isConfigured) {
        throw resolution.error
      }

      const request = buildSubtaskGenerationRequest({
        project,
        task,
        subtasks,
        tags,
        members,
        instructions,
      })

      return resolution.provider.generateSubtasks(request)
    },
    onMutate: () => {
      setGenerationError(null)
      setReviewMessage(null)
    },
    onSuccess: (result) => {
      setDrafts(createSubtaskGeneratorDrafts(result, tags))
    },
    onError: (error) => {
      setDrafts([])
      setGenerationError(toGenerationError(error))
    },
  })

  const insertMutation = useMutation({
    mutationFn: async (): Promise<SubtaskGeneratorInsertResult> => {
      if (taskId === undefined) {
        throw new Error('The parent task is unavailable.')
      }

      const selectedDrafts = drafts.filter((draft) => draft.isSelected && !draft.isInserted)

      if (selectedDrafts.length === 0) {
        return {
          status: 'empty_selection',
        }
      }

      const invalidDraftIds = selectedDrafts
        .filter((draft) =>
          Object.keys(
            validateSubtaskGeneratorDraft({
              title: draft.title,
              description: draft.description,
              priority: draft.priority,
              status: draft.status,
              dueDate: draft.dueDate,
            }),
          ).length > 0,
        )
        .map((draft) => draft.id)

      if (invalidDraftIds.length > 0) {
        return {
          status: 'validation_error',
          invalidDraftIds,
        }
      }

      const failedDraftTitles: string[] = []
      const successfulDraftIds: string[] = []

      for (const draft of selectedDrafts) {
        try {
          await createSubtask.mutateAsync(toCreateSubtaskInputFromSubtaskGeneratorDraft(taskId, draft))
          successfulDraftIds.push(draft.id)
        } catch {
          failedDraftTitles.push(draft.title)
        }
      }

      if (successfulDraftIds.length > 0) {
        setDrafts((currentDrafts) =>
          currentDrafts.map((draft) =>
            successfulDraftIds.includes(draft.id)
              ? {
                  ...draft,
                  isInserted: true,
                  isSelected: false,
                }
              : draft,
          ),
        )
      }

      return {
        status: 'completed',
        successCount: successfulDraftIds.length,
        failureCount: failedDraftTitles.length,
        failedDraftTitles,
      }
    },
    onMutate: () => {
      setReviewMessage(null)
    },
  })

  const updateDraft = <TField extends keyof SubtaskGeneratorDraftInput>(
    draftId: string,
    field: TField,
    value: SubtaskGeneratorDraftInput[TField],
  ) => {
    setDrafts((currentDrafts) =>
      currentDrafts.map((draft) => (draft.id === draftId ? updateSubtaskGeneratorDraftField(draft, field, value) : draft)),
    )
  }

  return {
    configurationState,
    drafts,
    generate: (instructions?: string) => generateMutation.mutateAsync(instructions),
    generationError,
    isGenerating: generateMutation.isPending,
    isInserting: insertMutation.isPending || createSubtask.isPending,
    project,
    task,
    reviewMessage,
    setReviewMessage,
    clearReview: () => {
      setDrafts([])
      setReviewMessage(null)
    },
    insertSelected: () => insertMutation.mutateAsync(),
    toggleDraftSelection: (draftId: string) => {
      setDrafts((currentDrafts) =>
        currentDrafts.map((draft) =>
          draft.id === draftId && !draft.isInserted
            ? {
                ...draft,
                isSelected: !draft.isSelected,
              }
            : draft,
        ),
      )
    },
    updateDraft,
  }
}
