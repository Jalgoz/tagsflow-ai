import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import type { AppSettings } from '../../domain'
import { buildProjectPlannerRequest } from './project-planner-input'
import {
  createProjectPlannerDrafts,
  toCreateTaskInputFromProjectPlannerDraft,
  updateProjectPlannerDraftField,
  validateProjectPlannerDraft,
  type ProjectPlannerDraft,
  type ProjectPlannerDraftInput,
} from './project-planner-drafts'
import { useProject } from '../projects'
import { useSettings } from '../settings'
import { useCreateTask, useTasksByProject } from '../tasks'
import { useMembers } from '../members'
import { useTags } from '../tags'
import { useAIProviderResolver } from './ai-provider-resolver-context'

export type ProjectPlannerGenerationError = {
  kind: 'provider' | 'validation'
  message: string
}

export type ProjectPlannerConfigurationState =
  | {
      isConfigured: true
    }
  | {
      actionLabel: string
      isConfigured: false
      message: string
    }

export type ProjectPlannerInsertResult =
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

const getProjectPlannerConfigurationState = (
  settings: AppSettings | undefined,
): ProjectPlannerConfigurationState => {
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
      message: 'Add a Groq API key in Settings before generating an AI project plan.',
      actionLabel: 'Configure AI',
    }
  }

  if (!hasNonEmptyValue(settings.aiProvider.selectedModelId)) {
    return {
      isConfigured: false,
      message: 'Select a Groq model in Settings before generating an AI project plan.',
      actionLabel: 'Select Model',
    }
  }

  return {
    isConfigured: true,
  }
}

const toGenerationError = (error: unknown): ProjectPlannerGenerationError => {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : null
  const message = error instanceof Error ? error.message : 'Unable to generate a project plan right now.'

  if (code === 'invalid_response') {
    return {
      kind: 'validation',
      message: 'The AI project planner returned data in an invalid format. Generate again.',
    }
  }

  return {
    kind: 'provider',
    message,
  }
}

export const useAIProjectPlanner = (projectId: string | undefined) => {
  const resolver = useAIProviderResolver()
  const { data: settings } = useSettings()
  const { data: project } = useProject(projectId)
  const { data: tasks = [] } = useTasksByProject(projectId)
  const { data: tags = [] } = useTags()
  const { data: members = [] } = useMembers()
  const createTask = useCreateTask()
  const [drafts, setDrafts] = useState<ProjectPlannerDraft[]>([])
  const [generationError, setGenerationError] = useState<ProjectPlannerGenerationError | null>(null)
  const [reviewMessage, setReviewMessage] = useState<string | null>(null)

  const configurationState = getProjectPlannerConfigurationState(settings)

  const generateMutation = useMutation({
    mutationFn: async (instructions?: string) => {
      if (projectId === undefined || project === null || project === undefined) {
        throw new Error('The current project is unavailable.')
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

      const request = buildProjectPlannerRequest({
        members,
        project,
        tags,
        tasks,
        instructions,
      })

      return resolution.provider.generateProjectPlan(request)
    },
    onMutate: () => {
      setGenerationError(null)
      setReviewMessage(null)
    },
    onSuccess: (result) => {
      setDrafts(createProjectPlannerDrafts(result, tags))
    },
    onError: (error) => {
      setDrafts([])
      setGenerationError(toGenerationError(error))
    },
  })

  const insertMutation = useMutation({
    mutationFn: async (): Promise<ProjectPlannerInsertResult> => {
      if (projectId === undefined) {
        throw new Error('The current project is unavailable.')
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
            validateProjectPlannerDraft({
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
          await createTask.mutateAsync(toCreateTaskInputFromProjectPlannerDraft(projectId, draft))
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

  const updateDraft = <TField extends keyof ProjectPlannerDraftInput>(
    draftId: string,
    field: TField,
    value: ProjectPlannerDraftInput[TField],
  ) => {
    setDrafts((currentDrafts) =>
      currentDrafts.map((draft) => (draft.id === draftId ? updateProjectPlannerDraftField(draft, field, value) : draft)),
    )
  }

  return {
    configurationState,
    drafts,
    generate: (instructions?: string) => generateMutation.mutateAsync(instructions),
    generationError,
    isGenerating: generateMutation.isPending,
    isInserting: insertMutation.isPending || createTask.isPending,
    project,
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
