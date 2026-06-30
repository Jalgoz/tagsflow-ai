import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MAX_PRIORITY_INSTRUCTION_LENGTH, useAIPrioritySuggestion } from '../../application/ai'
import { APP_ROUTE_PATHS } from '../../shared/constants/routes'
import { TASK_PRIORITY_LABELS } from '../../shared/constants/tasks'
import { FocusedFormDialog, useToast } from '../feedback'

type AIPrioritySuggestionDialogProps = {
  isOpen: boolean
  onClose: () => void
  projectId: string
  taskId: string | undefined
}

const formatPriority = (priority: string): string => TASK_PRIORITY_LABELS[priority as keyof typeof TASK_PRIORITY_LABELS]

export const AIPrioritySuggestionDialog = ({
  isOpen,
  onClose,
  projectId,
  taskId,
}: AIPrioritySuggestionDialogProps) => {
  const prioritySuggestion = useAIPrioritySuggestion(projectId, taskId)
  const toast = useToast()
  const [reviewMessage, setReviewMessage] = useState<string | null>(null)

  const isInstructionOverLimit = prioritySuggestion.instructions.trim().length > MAX_PRIORITY_INSTRUCTION_LENGTH
  const selectedProject = prioritySuggestion.project
  const selectedTask = prioritySuggestion.task
  const currentPriority = selectedTask?.priority ?? null
  const suggestedPriority = prioritySuggestion.currentSuggestion?.suggestedPriority ?? null
  const isSamePriority = currentPriority !== null && suggestedPriority !== null && currentPriority === suggestedPriority

  const handleClose = () => {
    prioritySuggestion.clearReview()
    prioritySuggestion.setInstructions('')
    setReviewMessage(null)
    onClose()
  }

  const handleGenerate = async () => {
    setReviewMessage(null)

    try {
      await prioritySuggestion.generate(prioritySuggestion.instructions)
    } catch {
      return
    }
  }

  const handleApply = async () => {
    const result = await prioritySuggestion.applySuggestion()

    if (result.status === 'updated') {
      toast.success('Task priority updated.')
      handleClose()
      return
    }

    if (result.status === 'same_priority') {
      setReviewMessage('This task already has the suggested priority.')
      return
    }

    setReviewMessage(result.message)
  }

  if (!isOpen) {
    return null
  }

  if (!prioritySuggestion.configurationState.isConfigured) {
    return (
      <FocusedFormDialog
        eyebrow="AI Insights"
        description="Suggest a priority for the selected task using project context and a review-before-apply flow."
        isOpen={isOpen}
        onClose={handleClose}
        title="AI PRIORITY SUGGESTION"
      >
        <div className="planner-panel__state planner-panel__state--muted" style={{ marginTop: '1rem' }}>
          <div>
            <h4 className="planner-panel__state-title">AI configuration required</h4>
            <p className="planner-panel__state-text">{prioritySuggestion.configurationState.message}</p>
          </div>
          <Link className="project-workspace__action project-workspace__action--secondary" to={APP_ROUTE_PATHS.settings} onClick={handleClose}>
            {prioritySuggestion.configurationState.actionLabel}
          </Link>
        </div>
      </FocusedFormDialog>
    )
  }

  if (selectedProject === undefined || selectedProject === null || selectedTask === undefined || selectedTask === null) {
    return (
      <FocusedFormDialog
        eyebrow="AI Insights"
        description="Suggest a priority for the selected task using project context and a review-before-apply flow."
        isOpen={isOpen}
        onClose={handleClose}
        title="AI PRIORITY SUGGESTION"
      >
        <div className="planner-panel__state" style={{ marginTop: '1rem' }}>
          <div>
            <h4 className="planner-panel__state-title">Loading task context</h4>
            <p className="planner-panel__state-text">Wait for the selected project and task data to finish loading.</p>
          </div>
        </div>
      </FocusedFormDialog>
    )
  }

  return (
    <FocusedFormDialog
      eyebrow="AI Insights"
      description="Suggest a priority for the selected task using project context and a review-before-apply flow."
      isOpen={isOpen}
      onClose={handleClose}
      title="AI PRIORITY SUGGESTION"
    >
      <div className="planner-panel planner-panel--priority-suggestion" style={{ padding: 0 }}>
        <div className="planner-panel__hero planner-panel__hero--priority-suggestion" style={{ padding: '1.5rem 0', borderBottom: 'none' }}>
          <div className="planner-panel__hero-copy">
            <p className="project-workspace__eyebrow">{selectedProject.title}</p>
            <h3 className="project-workspace__section-title">{selectedTask.title}</h3>
            <p className="project-workspace__description">
              Review the current priority, generate a bounded suggestion, and apply it only after explicit confirmation.
            </p>
          </div>

          <div className="planner-panel__hero-form">
            <label className="project-form__label" htmlFor="priority-suggestion-instructions">
              Additional instructions
            </label>
            <textarea
              id="priority-suggestion-instructions"
              className="project-form__input project-form__textarea"
              disabled={prioritySuggestion.isGenerating || prioritySuggestion.isApplying}
              placeholder="Example: Prioritize this based on urgency for the MVP launch"
              rows={3}
              value={prioritySuggestion.instructions}
              onChange={(event) => {
                prioritySuggestion.setInstructions(event.target.value)
                setReviewMessage(null)
              }}
            />
            {isInstructionOverLimit ? (
              <span className="project-form__error">Instructions must be {MAX_PRIORITY_INSTRUCTION_LENGTH} characters or fewer.</span>
            ) : null}
          </div>

          <div className="planner-panel__hero-actions planner-panel__hero-actions--priority-suggestion">
            <button
              className="project-workspace__action"
              disabled={prioritySuggestion.isGenerating || prioritySuggestion.isApplying || isInstructionOverLimit}
              type="button"
              onClick={() => void handleGenerate()}
            >
              {prioritySuggestion.isGenerating ? 'Generating...' : prioritySuggestion.currentSuggestion === null ? 'Generate suggestion' : 'Generate again'}
            </button>
            {prioritySuggestion.currentSuggestion !== null ? (
              <button
                className="project-workspace__action project-workspace__action--secondary"
                disabled={prioritySuggestion.isGenerating || prioritySuggestion.isApplying}
                type="button"
                onClick={handleClose}
              >
                Close review
              </button>
            ) : null}
          </div>
        </div>

        {prioritySuggestion.generationError !== null ? (
          <div className="planner-panel__state planner-panel__state--error">
            <div>
              <h4 className="planner-panel__state-title">
                {prioritySuggestion.generationError.kind === 'validation' ? 'Validation issue' : 'Provider issue'}
              </h4>
              <p className="planner-panel__state-text">{prioritySuggestion.generationError.message}</p>
            </div>
            <button
              className="project-workspace__action project-workspace__action--secondary"
              disabled={prioritySuggestion.isGenerating || prioritySuggestion.isApplying || isInstructionOverLimit}
              type="button"
              onClick={() => void handleGenerate()}
            >
              Retry
            </button>
          </div>
        ) : null}

        {prioritySuggestion.isGenerating ? (
          <div className="planner-panel__state">
            <div>
              <h4 className="planner-panel__state-title">Generating suggestion</h4>
              <p className="planner-panel__state-text">The AI is evaluating the selected task and its project context.</p>
            </div>
          </div>
        ) : null}

        {prioritySuggestion.currentSuggestion === null && prioritySuggestion.generationError === null && !prioritySuggestion.isGenerating ? (
          <div className="planner-panel__empty" style={{ marginTop: '1rem' }}>
            <h4 className="planner-panel__state-title">No suggestion yet</h4>
            <p className="planner-panel__state-text">
              Generate a suggestion to review a recommended priority before changing the task.
            </p>
          </div>
        ) : null}

        {prioritySuggestion.currentSuggestion !== null ? (
          <div className="planner-panel__review" style={{ paddingTop: '1rem' }}>
            <div className="planner-panel__review-header planner-panel__review-header--priority-suggestion">
              <div>
                <h4 className="planner-panel__state-title">Review suggestion</h4>
                <p className="planner-panel__state-text">
                  Confirm the suggested priority for this selected task before updating local data.
                </p>
              </div>

              <button
                className="project-workspace__action"
                disabled={prioritySuggestion.isApplying || prioritySuggestion.isGenerating || isInstructionOverLimit}
                type="button"
                onClick={() => void handleGenerate()}
              >
                {prioritySuggestion.isGenerating ? 'Generating...' : 'Generate again'}
              </button>
            </div>

            {reviewMessage !== null ? <p className="planner-panel__review-message">{reviewMessage}</p> : null}

            <div className="planner-panel__summary">
              <article className="planner-panel__summary-card">
                <span className="planner-panel__summary-label">Current priority</span>
                <strong className="planner-panel__summary-value">{formatPriority(selectedTask.priority)}</strong>
                <span className="planner-panel__summary-footnote">Existing task priority</span>
              </article>
              <article className="planner-panel__summary-card">
                <span className="planner-panel__summary-label">Suggested priority</span>
                <strong className="planner-panel__summary-value">{formatPriority(prioritySuggestion.currentSuggestion.suggestedPriority)}</strong>
                <span className="planner-panel__summary-footnote">AI review suggestion</span>
              </article>
            </div>

            <article className="planner-proposal-card">
              <div className="planner-proposal-card__top">
                <div className="planner-proposal-card__chips">
                  <span className={`task-priority task-priority--${selectedTask.priority}`}>{formatPriority(selectedTask.priority)}</span>
                  <span className={`task-priority task-priority--${prioritySuggestion.currentSuggestion.suggestedPriority}`}>
                    {formatPriority(prioritySuggestion.currentSuggestion.suggestedPriority)}
                  </span>
                </div>
                {isSamePriority ? <span className="planner-proposal-card__warning">The task already has this priority.</span> : null}
              </div>

              <p className="planner-panel__state-text" style={{ marginTop: '0.75rem' }}>
                {prioritySuggestion.currentSuggestion.rationale}
              </p>
            </article>

            <div className="planner-panel__hero-actions" style={{ marginTop: '1rem' }}>
              <button
                className="project-workspace__action project-workspace__action--secondary"
                disabled={prioritySuggestion.isApplying}
                type="button"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                className="project-workspace__action project-workspace__action--secondary"
                disabled={prioritySuggestion.isGenerating || prioritySuggestion.isApplying || isInstructionOverLimit}
                type="button"
                onClick={() => void handleGenerate()}
              >
                Retry
              </button>
              <button
                className="project-workspace__action"
                disabled={prioritySuggestion.isApplying || prioritySuggestion.isGenerating || isSamePriority}
                type="button"
                onClick={() => void handleApply()}
              >
                {prioritySuggestion.isApplying ? 'Applying...' : 'Apply priority'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </FocusedFormDialog>
  )
}
