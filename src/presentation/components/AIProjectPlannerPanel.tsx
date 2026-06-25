import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAIProjectPlanner, validateProjectPlannerDraft } from '../../application'
import { APP_ROUTE_PATHS } from '../../shared/constants/routes'
import { ConfirmDialog, useToast } from '../feedback'

type AIProjectPlannerPanelProps = {
  projectId: string
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

export const AIProjectPlannerPanel = ({ projectId }: AIProjectPlannerPanelProps) => {
  const planner = useAIProjectPlanner(projectId)
  const toast = useToast()
  const [confirmInsertOpen, setConfirmInsertOpen] = useState(false)

  const selectedDraftCount = planner.drafts.filter((draft) => draft.isSelected && !draft.isInserted).length
  const remainingDraftCount = planner.drafts.filter((draft) => !draft.isInserted).length
  const invalidSelectedDraftCount = useMemo(
    () =>
      planner.drafts.filter((draft) => {
        if (!draft.isSelected || draft.isInserted) {
          return false
        }

        return (
          Object.keys(
            validateProjectPlannerDraft({
              title: draft.title,
              description: draft.description,
              priority: draft.priority,
              status: draft.status,
              dueDate: draft.dueDate,
            }),
          ).length > 0
        )
      }).length,
    [planner.drafts],
  )

  const handleGenerate = async () => {
    try {
      await planner.generate()
    } catch {
      return
    }
  }

  const handleConfirmInsert = async () => {
    const result = await planner.insertSelected()

    setConfirmInsertOpen(false)

    if (result.status === 'empty_selection') {
      planner.setReviewMessage('Select at least one proposal before inserting tasks.')
      return
    }

    if (result.status === 'validation_error') {
      planner.setReviewMessage('Fix the highlighted proposal fields before inserting tasks.')
      return
    }

    if (result.successCount > 0 && result.failureCount === 0) {
      toast.success(`${result.successCount} planner task${result.successCount === 1 ? '' : 's'} inserted.`)
      planner.clearReview()

      return
    }

    if (result.successCount > 0) {
      const message = `${result.successCount} task${result.successCount === 1 ? '' : 's'} inserted. Review ${result.failureCount} remaining proposal${result.failureCount === 1 ? '' : 's'} and try again.`
      planner.setReviewMessage(message)
      toast.success(message)
      return
    }

    planner.setReviewMessage(
      result.failedDraftTitles.length > 0
        ? `Unable to insert: ${result.failedDraftTitles.join(', ')}.`
        : 'Unable to insert the selected proposals right now.',
    )
  }

  if (!planner.configurationState.isConfigured) {
    return (
      <section className="project-workspace__panel planner-panel">
        <div className="planner-panel__hero">
          <div>
            <p className="project-workspace__eyebrow">AI Project Planner</p>
            <h3 className="project-workspace__section-title">Generate draft top-level tasks</h3>
            <p className="project-workspace__description">
              Turn the current project context into reviewed task proposals before saving anything locally.
            </p>
          </div>
        </div>

        <div className="planner-panel__state planner-panel__state--muted">
          <div>
            <h4 className="planner-panel__state-title">AI configuration required</h4>
            <p className="planner-panel__state-text">{planner.configurationState.message}</p>
          </div>
          <Link className="project-workspace__action project-workspace__action--secondary" to={APP_ROUTE_PATHS.settings}>
            {planner.configurationState.actionLabel}
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="project-workspace__panel planner-panel">
      <div className="planner-panel__hero">
        <div>
          <p className="project-workspace__eyebrow">AI Project Planner</p>
          <h3 className="project-workspace__section-title">Generate draft top-level tasks</h3>
          <p className="project-workspace__description">
            The planner uses the current project, existing top-level tasks, members, and tags as context. You review and
            edit every proposal before insertion.
          </p>
        </div>

        <div className="planner-panel__hero-actions">
          <button className="project-workspace__action" disabled={planner.isGenerating} type="button" onClick={() => void handleGenerate()}>
            {planner.isGenerating ? 'Generating...' : planner.drafts.length > 0 ? 'Generate again' : 'Generate plan'}
          </button>
          {planner.drafts.length > 0 ? (
            <button
              className="project-workspace__action project-workspace__action--secondary"
              disabled={planner.isGenerating || planner.isInserting}
              type="button"
              onClick={planner.clearReview}
            >
              Close review
            </button>
          ) : null}
        </div>
      </div>

      <div className="planner-panel__summary">
        <article className="planner-panel__summary-card">
          <span className="planner-panel__summary-label">Ready to insert</span>
          <strong className="planner-panel__summary-value">{selectedDraftCount}</strong>
          <span className="planner-panel__summary-footnote">Selected proposals still pending insertion</span>
        </article>
        <article className="planner-panel__summary-card">
          <span className="planner-panel__summary-label">Needs review</span>
          <strong className="planner-panel__summary-value">{remainingDraftCount}</strong>
          <span className="planner-panel__summary-footnote">Drafts remaining in the current review set</span>
        </article>
      </div>

      {planner.generationError !== null ? (
        <div className="planner-panel__state planner-panel__state--error">
          <div>
            <h4 className="planner-panel__state-title">
              {planner.generationError.kind === 'validation' ? 'Validation issue' : 'Provider issue'}
            </h4>
            <p className="planner-panel__state-text">{planner.generationError.message}</p>
          </div>
          <button
            className="project-workspace__action project-workspace__action--secondary"
            disabled={planner.isGenerating}
            type="button"
            onClick={() => void handleGenerate()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {planner.isGenerating ? (
        <div className="planner-panel__state">
          <div>
            <h4 className="planner-panel__state-title">Generating proposals</h4>
            <p className="planner-panel__state-text">The planner is assembling reviewed top-level task proposals for this project.</p>
          </div>
        </div>
      ) : null}

      {planner.drafts.length === 0 && !planner.isGenerating && planner.generationError === null ? (
        <div className="planner-panel__empty">
          <h4 className="planner-panel__state-title">No proposals yet</h4>
          <p className="planner-panel__state-text">
            Generate a plan to review task proposals here. No task is created until you explicitly confirm insertion.
          </p>
        </div>
      ) : null}

      {planner.drafts.length > 0 ? (
        <div className="planner-panel__review">
          <div className="planner-panel__review-header">
            <div>
              <h4 className="planner-panel__state-title">Review proposals</h4>
              <p className="planner-panel__state-text">
                Select the tasks to insert, adjust the details you want, and confirm before mutating project data.
              </p>
            </div>

            <button
              className="project-workspace__action"
              disabled={planner.isInserting || selectedDraftCount === 0 || invalidSelectedDraftCount > 0}
              type="button"
              onClick={() => setConfirmInsertOpen(true)}
            >
              {planner.isInserting ? 'Inserting...' : `Insert selected (${selectedDraftCount})`}
            </button>
          </div>

          {planner.reviewMessage !== null ? <p className="planner-panel__review-message">{planner.reviewMessage}</p> : null}

          <div className="planner-panel__proposal-grid">
            {planner.drafts.map((draft) => {
              const validation = validateProjectPlannerDraft({
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
                        disabled={draft.isInserted || planner.isInserting}
                        type="checkbox"
                        onChange={() => planner.toggleDraftSelection(draft.id)}
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
                        disabled={draft.isInserted || planner.isInserting}
                        type="text"
                        value={draft.title}
                        onChange={(event) => planner.updateDraft(draft.id, 'title', event.target.value)}
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
                        disabled={draft.isInserted || planner.isInserting}
                        rows={4}
                        value={draft.description}
                        onChange={(event) => planner.updateDraft(draft.id, 'description', event.target.value)}
                      />
                    </div>

                    <div className="project-form__field">
                      <label className="project-form__label" htmlFor={`${draft.id}-priority`}>
                        Priority
                      </label>
                      <select
                        id={`${draft.id}-priority`}
                        className="project-form__input"
                        disabled={draft.isInserted || planner.isInserting}
                        value={draft.priority}
                        onChange={(event) => planner.updateDraft(draft.id, 'priority', event.target.value as typeof draft.priority)}
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
                        disabled={draft.isInserted || planner.isInserting}
                        value={draft.status}
                        onChange={(event) => planner.updateDraft(draft.id, 'status', event.target.value as typeof draft.status)}
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
                        disabled={draft.isInserted || planner.isInserting}
                        type="date"
                        value={draft.dueDate ?? ''}
                        onChange={(event) => planner.updateDraft(draft.id, 'dueDate', event.target.value)}
                      />
                      {validation.dueDate ? <span className="project-form__error">{validation.dueDate}</span> : null}
                    </div>
                  </div>

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

      <ConfirmDialog
        cancelLabel="Keep reviewing"
        confirmLabel="Insert tasks"
        description={`This inserts ${selectedDraftCount} selected proposal${selectedDraftCount === 1 ? '' : 's'} as normal project tasks.`}
        isDisabled={selectedDraftCount === 0}
        isOpen={confirmInsertOpen}
        isPending={planner.isInserting}
        onCancel={() => setConfirmInsertOpen(false)}
        onConfirm={handleConfirmInsert}
        pendingLabel="Inserting tasks..."
        title="Insert selected planner tasks?"
      />
    </section>
  )
}
