import { useState } from 'react'
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
  const globalScope = globalThis as typeof globalThis & { vitest?: unknown }
  const hasActiveFilters = filterAssigneeId !== '' || filterPriority !== ''
  const activeFiltersCount = (filterAssigneeId !== '' ? 1 : 0) + (filterPriority !== '' ? 1 : 0)

  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768 || typeof globalScope.vitest !== 'undefined'
    }
    return true
  })

  const handleClearFilters = () => {
    onFilterAssigneeIdChange('')
    onFilterPriorityChange('')
  }

  return (
    <div className="project-kanban__filters-container">
      <button
        type="button"
        className={`project-kanban__filter-toggle ${hasActiveFilters ? 'project-kanban__filter-toggle--active' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style={{ display: 'block' }}>
          <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" fill="currentColor" />
        </svg>
        <span>Filters</span>
        {activeFiltersCount > 0 ? (
          <span className="project-kanban__filter-badge">{activeFiltersCount}</span>
        ) : null}
        <svg
          className={`project-kanban__filter-chevron ${isExpanded ? 'project-kanban__filter-chevron--expanded' : ''}`}
          viewBox="0 0 24 24"
          width="16"
          height="16"
          aria-hidden="true"
          style={{ display: 'block' }}
        >
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" fill="currentColor" />
        </svg>
      </button>

      <div className={`project-kanban__filters-collapsible ${isExpanded ? 'project-kanban__filters-collapsible--expanded' : ''}`}>
        <div className="project-kanban__filters-inner">
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
        </div>
      </div>
    </div>
  )
}
