import { useMutation } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { ProjectSummaryResult } from '../../domain'
import { useMembers } from '../members'
import { useProject } from '../projects'
import { useSettings } from '../settings'
import { useSubtasks } from '../subtasks'
import { useTags } from '../tags'
import { useTasksByProject } from '../tasks'
import { useAIProviderResolver } from './ai-provider-resolver-context'
import {
  createProjectSummaryUseCases,
  getProjectSummaryConfigurationState,
  ProjectSummaryInputError,
  type ProjectSummaryConfigurationState,
} from './project-summary-use-cases'

export type ProjectSummaryGenerationError = {
  kind: 'provider' | 'validation' | 'missing_context'
  message: string
}

const toReferenceDate = (): string => new Date().toISOString().slice(0, 10)

const toGenerationError = (error: unknown): ProjectSummaryGenerationError => {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : null
  const message = error instanceof Error ? error.message : 'Unable to generate a project summary right now.'

  if (error instanceof ProjectSummaryInputError || code === 'invalid_response') {
    return {
      kind: 'validation',
      message:
        error instanceof ProjectSummaryInputError
          ? error.message
          : 'The AI project summary returned data in an invalid format. Generate again.',
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

export const useAIProjectSummary = (projectId: string | undefined) => {
  const resolver = useAIProviderResolver()
  const { data: settings } = useSettings()
  const { data: project } = useProject(projectId)
  const { data: tasks = [] } = useTasksByProject(projectId)
  const { data: subtasks = [] } = useSubtasks()
  const { data: tags = [] } = useTags()
  const { data: members = [] } = useMembers()
  const [summary, setSummary] = useState<ProjectSummaryResult | null>(null)
  const [generationError, setGenerationError] = useState<ProjectSummaryGenerationError | null>(null)
  const [instructions, setInstructions] = useState('')

  const configurationState: ProjectSummaryConfigurationState = getProjectSummaryConfigurationState(settings)

  const missingContextMessage = useMemo(() => {
    if (projectId === undefined) {
      return 'The current project is unavailable.'
    }

    if (project === undefined) {
      return 'Project context is still loading.'
    }

    if (project === null) {
      return 'The current project is unavailable.'
    }

    return null
  }, [project, projectId])

  const generationMutation = useMutation({
    mutationFn: async (additionalInstructions?: string) => {
      if (projectId === undefined || project === null || project === undefined) {
        throw new Error('The current project is unavailable.')
      }

      if (settings === undefined) {
        throw new Error('AI configuration is still loading.')
      }

      if (!configurationState.isConfigured) {
        throw new Error(configurationState.message)
      }

      const useCases = createProjectSummaryUseCases(
        {
          get: async () => settings,
          save: async (value) => value,
          reset: async () => settings,
        },
        resolver,
      )

      return useCases.generateProjectSummary({
        additionalInstructions,
        members,
        project,
        referenceDate: toReferenceDate(),
        subtasks,
        tags,
        tasks,
      })
    },
    onMutate: () => {
      setGenerationError(null)
      setSummary(null)
    },
    onSuccess: (result) => {
      setSummary(result)
    },
    onError: (error) => {
      setSummary(null)
      setGenerationError(toGenerationError(error))
    },
  })

  return {
    clearSummary: () => {
      setSummary(null)
      setGenerationError(null)
    },
    configurationState,
    currentSummary: summary,
    generate: (additionalInstructions?: string) => generationMutation.mutateAsync(additionalInstructions),
    generationError,
    instructions,
    isGenerating: generationMutation.isPending,
    isProjectContextAvailable: missingContextMessage === null,
    missingContextMessage,
    project,
    setInstructions,
  }
}
