type TaskCardActionsProps = {
  className?: string
  isExpanded: boolean
  layout?: 'inline' | 'stacked'
  onDelete: () => void
  onEdit: () => void
  onSuggestPriority?: () => void
  onToggleExpanded: () => void
}

const joinClassNames = (...classNames: Array<string | undefined>): string =>
  classNames.filter((className) => className !== undefined && className.trim().length > 0).join(' ')

export const TaskCardActions = ({
  className,
  isExpanded,
  layout = 'stacked',
  onDelete,
  onEdit,
  onSuggestPriority,
  onToggleExpanded,
}: TaskCardActionsProps) => (
  <div className={joinClassNames('task-actions', layout === 'inline' ? 'task-actions--inline' : undefined, className)}>
    <button className="project-list__button task-actions__toggle" type="button" onClick={onToggleExpanded}>
      {isExpanded ? 'Hide subtasks' : 'Show subtasks'}
    </button>
    <div
      className="task-actions__icon-row"
      style={onSuggestPriority === undefined ? undefined : { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
    >
      {onSuggestPriority ? (
        <button
          aria-label="Suggest priority"
          className="project-list__button project-list__button--secondary project-kanban__icon-button task-actions__icon-button"
          type="button"
          onClick={onSuggestPriority}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
            <path
              d="M12 2l1.9 5.8H20l-4.9 3.6L17 17l-5-3.6L7 17l1.9-5.6L4 7.8h6.1L12 2z"
              fill="currentColor"
            />
          </svg>
        </button>
      ) : null}
      <button
        aria-label="Edit"
        className="project-list__button project-kanban__icon-button task-actions__icon-button"
        type="button"
        onClick={onEdit}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
          <path
            d="M4 20h4l10-10-4-4L4 16v4zm13.7-11.3l-2.4-2.4 1.4-1.4a1 1 0 011.4 0l1 1a1 1 0 010 1.4l-1.4 1.4z"
            fill="currentColor"
          />
        </svg>
      </button>
      <button
        aria-label="Delete"
        className="project-list__button project-list__button--danger project-kanban__icon-button task-actions__icon-button"
        type="button"
        onClick={onDelete}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
          <path
            d="M7 21a2 2 0 01-2-2V7h14v12a2 2 0 01-2 2H7zm3-4h2V9h-2v8zm4 0h2V9h-2v8zM9 4h6l1 2h4v2H4V6h4l1-2z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  </div>
)
