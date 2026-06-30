import { Link } from 'react-router-dom'
import { useAIProjectSummary, MAX_PROJECT_SUMMARY_INSTRUCTION_LENGTH } from '../../application'
import { APP_ROUTE_PATHS } from '../../shared/constants/routes'

type AIProjectSummaryPanelProps = {
  projectId: string
}

const formatHealthLabel = (value: 'on_track' | 'at_risk' | 'blocked'): string => {
  switch (value) {
    case 'on_track':
      return 'On Track'
    case 'at_risk':
      return 'At Risk'
    case 'blocked':
      return 'Blocked'
  }
}

const formatHealthTone = (value: 'on_track' | 'at_risk' | 'blocked'): string => {
  switch (value) {
    case 'on_track':
      return '#166534'
    case 'at_risk':
      return '#b45309'
    case 'blocked':
      return '#b91c1c'
  }
}

const renderStringList = (items: string[]) => {
  if (items.length === 0) {
    return <p className="planner-panel__state-text">None identified in the validated AI response.</p>
  }

  return (
    <ul className="planner-panel__state-text" style={{ margin: 0, paddingLeft: '1.1rem' }}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

export const AIProjectSummaryPanel = ({ projectId }: AIProjectSummaryPanelProps) => {
  const summary = useAIProjectSummary(projectId)

  const handleGenerate = async () => {
    try {
      await summary.generate(summary.instructions)
    } catch {
      return
    }
  }

  if (!summary.configurationState.isConfigured) {
    return (
      <section className="project-workspace__panel planner-panel">
        <div className="planner-panel__hero">
          <div>
            <p className="project-workspace__eyebrow">AI Project Summary</p>
            <h3 className="project-workspace__section-title">Generate a read-only health review</h3>
            <p className="project-workspace__description">
              Summarize the current project progress, blockers, and next steps without mutating any local data.
            </p>
          </div>
        </div>

        <div className="planner-panel__state planner-panel__state--muted">
          <div>
            <h4 className="planner-panel__state-title">AI configuration required</h4>
            <p className="planner-panel__state-text">{summary.configurationState.message}</p>
          </div>
          <Link className="project-workspace__action project-workspace__action--secondary" to={APP_ROUTE_PATHS.settings}>
            {summary.configurationState.actionLabel}
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="project-workspace__panel planner-panel">
      <div className="planner-panel__hero">
        <div style={{ flex: '1 1 40%', minWidth: '300px' }}>
          <p className="project-workspace__eyebrow">AI Project Summary</p>
          <h3 className="project-workspace__section-title">Generate a read-only health review</h3>
          <p className="project-workspace__description">
            The summary uses the current project, tasks, subtasks, members, tags, and derived progress as bounded context.
          </p>
        </div>

        <div className="project-form__field" style={{ flex: '1 1 60%', minWidth: '300px' }}>
          <label className="project-form__label" htmlFor="project-summary-instructions">
            Additional instructions
          </label>
          <textarea
            id="project-summary-instructions"
            className="project-form__input project-form__textarea"
            disabled={summary.isGenerating}
            placeholder="Example: Summarize this project for a weekly stakeholder update"
            rows={3}
            value={summary.instructions}
            onChange={(event) => summary.setInstructions(event.target.value)}
          />
          {summary.instructions.length > MAX_PROJECT_SUMMARY_INSTRUCTION_LENGTH ? (
            <span className="project-form__error">
              Instructions must be {MAX_PROJECT_SUMMARY_INSTRUCTION_LENGTH} characters or fewer.
            </span>
          ) : null}
        </div>

        <div className="planner-panel__hero-actions">
          <button
            className="project-workspace__action"
            disabled={
              summary.isGenerating ||
              !summary.isProjectContextAvailable ||
              summary.instructions.length > MAX_PROJECT_SUMMARY_INSTRUCTION_LENGTH
            }
            style={{ width: '100%' }}
            type="button"
            onClick={() => void handleGenerate()}
          >
            {summary.isGenerating ? 'Generating...' : summary.currentSummary !== null ? 'Generate again' : 'Generate summary'}
          </button>
          {summary.currentSummary !== null || summary.generationError !== null ? (
            <button
              className="project-workspace__action project-workspace__action--secondary"
              disabled={summary.isGenerating}
              style={{ width: '100%' }}
              type="button"
              onClick={summary.clearSummary}
            >
              Clear summary
            </button>
          ) : null}
        </div>
      </div>

      {!summary.isProjectContextAvailable ? (
        <div className="planner-panel__state">
          <div>
            <h4 className="planner-panel__state-title">Project context unavailable</h4>
            <p className="planner-panel__state-text">{summary.missingContextMessage}</p>
          </div>
        </div>
      ) : null}

      {summary.generationError !== null ? (
        <div className="planner-panel__state planner-panel__state--error">
          <div>
            <h4 className="planner-panel__state-title">
              {summary.generationError.kind === 'validation' ? 'Validation issue' : 'Summary generation issue'}
            </h4>
            <p className="planner-panel__state-text">{summary.generationError.message}</p>
          </div>
          <button
            className="project-workspace__action project-workspace__action--secondary"
            disabled={summary.isGenerating}
            type="button"
            onClick={() => void handleGenerate()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {summary.isGenerating ? (
        <div className="planner-panel__state">
          <div>
            <h4 className="planner-panel__state-title">Generating summary</h4>
            <p className="planner-panel__state-text">The AI is reviewing the current project health and next-step signals.</p>
          </div>
        </div>
      ) : null}

      {summary.currentSummary === null && summary.generationError === null && !summary.isGenerating && summary.isProjectContextAvailable ? (
        <div className="planner-panel__empty">
          <h4 className="planner-panel__state-title">No summary yet</h4>
          <p className="planner-panel__state-text">
            Generate a summary to review validated health, blockers, risks, and next steps here. Nothing is persisted.
          </p>
        </div>
      ) : null}

      {summary.currentSummary !== null ? (
        <div className="planner-panel__review">
          <div className="planner-panel__review-header">
            <div>
              <h4 className="planner-panel__state-title">Current summary</h4>
              <p className="planner-panel__state-text">
                This result is informational only and stays in transient UI state until you clear or regenerate it.
              </p>
            </div>
          </div>

          <div className="planner-panel__summary">
            <article className="planner-panel__summary-card">
              <span className="planner-panel__summary-label">Health</span>
              <strong className="planner-panel__summary-value" style={{ color: formatHealthTone(summary.currentSummary.health) }}>
                {formatHealthLabel(summary.currentSummary.health)}
              </strong>
              <span className="planner-panel__summary-footnote">Validated project health label</span>
            </article>
            <article className="planner-panel__summary-card">
              <span className="planner-panel__summary-label">Risks</span>
              <strong className="planner-panel__summary-value">{summary.currentSummary.risks.length}</strong>
              <span className="planner-panel__summary-footnote">Captured from the validated response</span>
            </article>
            <article className="planner-panel__summary-card">
              <span className="planner-panel__summary-label">Blockers</span>
              <strong className="planner-panel__summary-value">{summary.currentSummary.blockers.length}</strong>
              <span className="planner-panel__summary-footnote">Read-only blocker highlights</span>
            </article>
          </div>

          <div
            style={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            }}
          >
            <article className="planner-panel__summary-card" style={{ gridColumn: '1 / -1' }}>
              <span className="planner-panel__summary-label">Summary</span>
              <p className="planner-panel__state-text" style={{ margin: '0.75rem 0 0' }}>
                {summary.currentSummary.summary}
              </p>
            </article>
            <article className="planner-panel__summary-card">
              <span className="planner-panel__summary-label">Key risks</span>
              {renderStringList(summary.currentSummary.risks)}
            </article>
            <article className="planner-panel__summary-card">
              <span className="planner-panel__summary-label">Blockers</span>
              {renderStringList(summary.currentSummary.blockers)}
            </article>
            <article className="planner-panel__summary-card">
              <span className="planner-panel__summary-label">Recommended next steps</span>
              {renderStringList(summary.currentSummary.nextSteps)}
            </article>
            {summary.currentSummary.notableCompletedWork.length > 0 ? (
              <article className="planner-panel__summary-card">
                <span className="planner-panel__summary-label">Notable completed work</span>
                {renderStringList(summary.currentSummary.notableCompletedWork)}
              </article>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}
