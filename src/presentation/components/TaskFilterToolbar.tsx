import type { Member } from '../../domain'
import { TASK_PRIORITY_LABELS } from '../../shared/constants'

type TaskFilterToolbarProps = {
  members: Member[]
  filterAssigneeId: string
  onFilterAssigneeIdChange: (value: string) => void
  filterPriority: string
  onFilterPriorityChange: (value: string) => void
}

export const TaskFilterToolbar = ({
  members,
  filterAssigneeId,
  onFilterAssigneeIdChange,
  filterPriority,
  onFilterPriorityChange,
}: TaskFilterToolbarProps) => {
  const hasActiveFilters = filterAssigneeId !== '' || filterPriority !== ''

  const handleClearFilters = () => {
    onFilterAssigneeIdChange('')
    onFilterPriorityChange('')
  }

  return (
    <div className="project-kanban__toolbar" aria-label="Kanban filters">
      <label className="project-kanban__control">
        <span>Assignee</span>
        <select
          aria-label="Filter by Assignee"
          className="project-form__input"
          value={filterAssigneeId}
          onChange={(e) => onFilterAssigneeIdChange(e.target.value)}
        >
          <option value="">All assignees</option>
          <option value="__unassigned__">Unassigned</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </label>

      <label className="project-kanban__control">
        <span>Priority</span>
        <select
          aria-label="Filter by Priority"
          className="project-form__input"
          value={filterPriority}
          onChange={(e) => onFilterPriorityChange(e.target.value)}
        >
          <option value="">All priorities</option>
          {Object.entries(TASK_PRIORITY_LABELS).map(([priority, label]) => (
            <option key={priority} value={priority}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {hasActiveFilters ? (
        <button
          className="project-list__button project-list__button--secondary project-kanban__clear-filters"
          type="button"
          onClick={handleClearFilters}
        >
          Clear filters
        </button>
      ) : null}
    </div>
  )
}
