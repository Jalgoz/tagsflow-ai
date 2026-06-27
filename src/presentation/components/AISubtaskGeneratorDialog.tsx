import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAISubtaskGenerator, validateSubtaskGeneratorDraft } from '../../application/ai'
import { MAX_SUBTASK_INSTRUCTION_LENGTH } from '../../application/ai/subtask-generator-input'
import { APP_ROUTE_PATHS } from '../../shared/constants/routes'
import { ConfirmDialog, FocusedFormDialog, useToast } from '../feedback'

type AISubtaskGeneratorDialogProps = {
  isOpen: boolean
  onClose: () => void
  projectId: string
  taskId: string
}

const formatStatus = (status: string): string => {
  const labels: Record<string, string> = {
    backlog: 'Backlog',
    todo: 'To Do',
    in_progress: 'In Progress',
    blocked: 'Blocked',
    review: 'Review',
    done: 'Done',
  }

  return labels[status] ?? status
}

const formatPriority = (priority: string): string => `${priority.slice(0, 1).toUpperCase()}${priority.slice(1)}`

export const AISubtaskGeneratorDialog = ({ isOpen, onClose, projectId, taskId }: AISubtaskGeneratorDialogProps) => {
  const generator = useAISubtaskGenerator(projectId, taskId)
  const toast = useToast()
  const [confirmInsertOpen, setConfirmInsertOpen] = useState(false)
  const [instructions, setInstructions] = useState('')

  const selectedDraftCount = generator.drafts.filter((draft) => draft.isSelected && !draft.isInserted).length
  const invalidSelectedDraftCount = useMemo(
    () =>
      generator.drafts.filter((draft) => {
        if (!draft.isSelected || draft.isInserted) {
          return false
        }

        return (
          Object.keys(
            validateSubtaskGeneratorDraft({
              title: draft.title,
              description: draft.description,
              priority: draft.priority,
              status: draft.status,
              dueDate: draft.dueDate,
            }),
          ).length > 0
        )
      }).length,
    [generator.drafts],
  )

  const handleGenerate = async () => {
    try {
      await generator.generate(instructions)
    } catch {
      return
    }
  }

  const handleConfirmInsert = async () => {
    const result = await generator.insertSelected()

    setConfirmInsertOpen(false)

    if (result.status === 'empty_selection') {
      generator.setReviewMessage('Select at least one subtask proposal before inserting.')
      return
    }

    if (result.status === 'validation_error') {
      generator.setReviewMessage('Fix the highlighted proposal fields before inserting.')
      return
    }

    if (result.successCount > 0 && result.failureCount === 0) {
      toast.success(`${result.successCount} subtask${result.successCount === 1 ? '' : 's'} inserted.`)
      generator.clearReview()
      onClose()
      return
    }

    if (result.successCount > 0) {
      const message = `${result.successCount} subtask${result.successCount === 1 ? '' : 's'} inserted. Review ${result.failureCount} remaining proposal${result.failureCount === 1 ? '' : 's'} and try again.`
      generator.setReviewMessage(message)
      toast.success(message)
      return
    }

    generator.setReviewMessage(
      result.failedDraftTitles.length > 0
        ? `Unable to insert: ${result.failedDraftTitles.join(', ')}.`
        : 'Unable to insert the selected proposals right now.',
    )
  }

  const handleClose = () => {
    generator.clearReview()
    setInstructions('')
    onClose()
  }

  if (!isOpen) {
    return null
  }

  const headerActions = (
    <div className="focused-form-dialog__header-actions">
      {generator.drafts.length > 0 && (
        <button
          className="project-form__button project-form__button--primary"
          style={{ whiteSpace: 'nowrap' }}
          type="button"
          disabled={generator.isInserting || selectedDraftCount === 0 || invalidSelectedDraftCount > 0}
          onClick={() => setConfirmInsertOpen(true)}
        >
          {generator.isInserting ? 'Inserting...' : `Insert selected (${selectedDraftCount})`}
        </button>
      )}
    </div>
  )

  const renderContent = () => {
    if (!generator.configurationState.isConfigured) {
      return (
        <div className="planner-panel__state planner-panel__state--muted" style={{ marginTop: '2rem' }}>
          <div>
            <h4 className="planner-panel__state-title">AI configuration required</h4>
            <p className="planner-panel__state-text">{generator.configurationState.message}</p>
          </div>
          <Link className="project-workspace__action project-workspace__action--secondary" to={APP_ROUTE_PATHS.settings} onClick={handleClose}>
            {generator.configurationState.actionLabel}
          </Link>
        </div>
      )
    }

    return (
      <div className="planner-panel" style={{ padding: 0 }}>
        {generator.drafts.length === 0 ? (
          <div className="planner-panel__hero" style={{ padding: '2rem 0', borderBottom: 'none' }}>
            <div className="project-form__field" style={{ flex: 1 }}>
              <label className="project-form__label" htmlFor="generator-instructions">
                Additional subtask instructions
              </label>
              <textarea
                id="generator-instructions"
                className="project-form__input project-form__textarea"
                disabled={generator.isGenerating}
                placeholder="Example: Break down the testing steps for this component"
                rows={4}
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
              />
              {instructions.length > MAX_SUBTASK_INSTRUCTION_LENGTH ? (
                <span className="project-form__error">Instructions must be {MAX_SUBTASK_INSTRUCTION_LENGTH} characters or fewer.</span>
              ) : null}
            </div>

            <div className="planner-panel__hero-actions" style={{ minWidth: '180px', justifyContent: 'flex-end', paddingBottom: instructions.length > MAX_SUBTASK_INSTRUCTION_LENGTH ? '20px' : '0' }}>
              <button
                className="project-workspace__action"
                disabled={generator.isGenerating || instructions.length > MAX_SUBTASK_INSTRUCTION_LENGTH}
                style={{ width: '100%' }}
                type="button"
                onClick={() => void handleGenerate()}
              >
                {generator.isGenerating ? 'Generating...' : 'Generate subtasks'}
              </button>
            </div>
          </div>
        ) : null}

        {generator.generationError !== null ? (
          <div className="planner-panel__state planner-panel__state--error">
            <div>
              <h4 className="planner-panel__state-title">
                {generator.generationError.kind === 'validation' ? 'Validation issue' : 'Provider issue'}
              </h4>
              <p className="planner-panel__state-text">{generator.generationError.message}</p>
            </div>
            <button
              className="project-workspace__action project-workspace__action--secondary"
              disabled={generator.isGenerating}
              type="button"
              onClick={() => void handleGenerate()}
            >
              Retry
            </button>
          </div>
        ) : null}

        {generator.isGenerating ? (
          <div className="planner-panel__state">
            <div>
              <h4 className="planner-panel__state-title">Generating proposals</h4>
              <p className="planner-panel__state-text">The generator is assembling reviewed subtask proposals for this task.</p>
            </div>
          </div>
        ) : null}

        {generator.drafts.length > 0 ? (
          <div className="planner-panel__review" style={{ paddingTop: '1rem' }}>
            <div className="planner-panel__review-header">
              <div>
                <h4 className="planner-panel__state-title">Review proposals</h4>
                <p className="planner-panel__state-text">
                  Select the subtasks to insert, adjust the details you want, and confirm.
                </p>
              </div>
              <button
                className="project-workspace__action project-workspace__action--secondary"
                disabled={generator.isGenerating || generator.isInserting || instructions.length > MAX_SUBTASK_INSTRUCTION_LENGTH}
                type="button"
                onClick={() => void handleGenerate()}
              >
                {generator.isGenerating ? 'Generating...' : 'Generate again'}
              </button>
            </div>

            {generator.reviewMessage !== null ? <p className="planner-panel__review-message">{generator.reviewMessage}</p> : null}

            <div className="planner-panel__proposal-grid" style={{ gridTemplateColumns: '1fr' }}>
              {generator.drafts.map((draft) => {
                const validation = validateSubtaskGeneratorDraft({
                  title: draft.title,
                  description: draft.description,
                  priority: draft.priority,
                  status: draft.status,
                  dueDate: draft.dueDate,
                })

                return (
                  <article
                    key={draft.id}
                    className={`planner-proposal-card${draft.isInserted ? ' planner-proposal-card--inserted' : ''}`}
                  >
                    <div className="planner-proposal-card__top">
                      <label className="planner-proposal-card__checkbox">
                        <input
                          checked={draft.isSelected}
                          disabled={draft.isInserted || generator.isInserting}
                          type="checkbox"
                          onChange={() => generator.toggleDraftSelection(draft.id)}
                        />
                        <span>{draft.isInserted ? 'Inserted' : 'Select proposal'}</span>
                      </label>
                      <div className="planner-proposal-card__chips">
                        <span className={`task-priority task-priority--${draft.priority}`}>{formatPriority(draft.priority)}</span>
                        <span className={`project-status project-status--${draft.status}`}>{formatStatus(draft.status)}</span>
                      </div>
                    </div>

                    <div className="planner-proposal-card__fields">
                      <div className="project-form__field project-form__field--wide">
                        <label className="project-form__label" htmlFor={`${draft.id}-title`}>
                          Title *
                        </label>
                        <input
                          id={`${draft.id}-title`}
                          className="project-form__input"
                          disabled={draft.isInserted || generator.isInserting}
                          type="text"
                          value={draft.title}
                          onChange={(event) => generator.updateDraft(draft.id, 'title', event.target.value)}
                        />
                        {validation.title ? <span className="project-form__error">{validation.title}</span> : null}
                      </div>

                      <div className="project-form__field project-form__field--wide">
                        <label className="project-form__label" htmlFor={`${draft.id}-description`}>
                          Description
                        </label>
                        <textarea
                          id={`${draft.id}-description`}
                          className="project-form__input project-form__textarea planner-proposal-card__textarea"
                          disabled={draft.isInserted || generator.isInserting}
                          rows={3}
                          value={draft.description}
                          onChange={(event) => generator.updateDraft(draft.id, 'description', event.target.value)}
                        />
                      </div>

                      <div className="project-form__field">
                        <label className="project-form__label" htmlFor={`${draft.id}-priority`}>
                          Priority
                        </label>
                        <select
                          id={`${draft.id}-priority`}
                          className="project-form__input"
                          disabled={draft.isInserted || generator.isInserting}
                          value={draft.priority}
                          onChange={(event) => generator.updateDraft(draft.id, 'priority', event.target.value as typeof draft.priority)}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>

                      <div className="project-form__field">
                        <label className="project-form__label" htmlFor={`${draft.id}-status`}>
                          Status
                        </label>
                        <select
                          id={`${draft.id}-status`}
                          className="project-form__input"
                          disabled={draft.isInserted || generator.isInserting}
                          value={draft.status}
                          onChange={(event) => generator.updateDraft(draft.id, 'status', event.target.value as typeof draft.status)}
                        >
                          <option value="backlog">Backlog</option>
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="blocked">Blocked</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </select>
                      </div>

                      <div className="project-form__field">
                        <label className="project-form__label" htmlFor={`${draft.id}-due-date`}>
                          Due date
                        </label>
                        <input
                          id={`${draft.id}-due-date`}
                          className="project-form__input"
                          disabled={draft.isInserted || generator.isInserting}
                          type="date"
                          value={draft.dueDate ?? ''}
                          onChange={(event) => generator.updateDraft(draft.id, 'dueDate', event.target.value)}
                        />
                        {validation.dueDate ? <span className="project-form__error">{validation.dueDate}</span> : null}
                      </div>
                    </div>

                    {draft.checklistItems.length > 0 ? (
                      <div className="planner-proposal-card__tag-row">
                        <span className="planner-proposal-card__tag-label">Checklist items</span>
                        <div className="planner-proposal-card__tag-list" style={{ flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                          {draft.checklistItems.map((item, index) => (
                            <span key={index} className="planner-proposal-card__tag-chip">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {draft.matchedTagNames.length > 0 ? (
                      <div className="planner-proposal-card__tag-row">
                        <span className="planner-proposal-card__tag-label">Existing tags</span>
                        <div className="planner-proposal-card__tag-list">
                          {draft.matchedTagNames.map((tagName) => (
                            <span key={tagName} className="planner-proposal-card__tag-chip">
                              {tagName}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {draft.unappliedTagNames.length > 0 ? (
                      <p className="planner-proposal-card__warning">
                        Ignored tag suggestions: {draft.unappliedTagNames.join(', ')}.
                      </p>
                    ) : null}
                  </article>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <>
      <FocusedFormDialog
        isOpen={isOpen}
        onClose={handleClose}
        title="AI SUBTASK GENERATOR"
        description="Generate draft subtasks based on the parent task, project, and any existing subtasks."
        eyebrow="AI Insights"
        headerActions={headerActions}
      >
        {renderContent()}
      </FocusedFormDialog>
      <ConfirmDialog
        cancelLabel="Keep reviewing"
        confirmLabel="Insert subtasks"
        description={`This inserts ${selectedDraftCount} selected proposal${selectedDraftCount === 1 ? '' : 's'} as normal subtasks.`}
        isDisabled={selectedDraftCount === 0}
        isOpen={confirmInsertOpen}
        isPending={generator.isInserting}
        onCancel={() => setConfirmInsertOpen(false)}
        onConfirm={handleConfirmInsert}
        pendingLabel="Inserting subtasks..."
        title="Insert selected subtasks?"
      />
    </>
  )
}
