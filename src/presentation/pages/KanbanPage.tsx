import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMembers, useProjects, useSubtasks, useTags, useTasks } from '../../application'
import { APP_ROUTE_PATHS, TASK_PRIORITY_LABELS } from '../../shared/constants'
import {
  UNASSIGNED_FILTER_VALUE,
  buildGlobalKanbanCards,
  createEmptyGlobalKanbanFilters,
  filterGlobalKanbanCards,
  groupGlobalKanbanCards,
  type GlobalKanbanFilters,
} from './global-kanban'

const isFilterStateEmpty = (filters: GlobalKanbanFilters): boolean =>
  filters.projectId === '' && filters.priority === '' && filters.assigneeId === '' && filters.tagId === ''

export const KanbanPage = () => {
  const { data: tasks = [], error: tasksError, isError: isTasksError, isLoading: isTasksLoading } = useTasks()
  const { data: projects = [], error: projectsError, isError: isProjectsError, isLoading: isProjectsLoading } = useProjects()
  const { data: subtasks = [], error: subtasksError, isError: isSubtasksError, isLoading: isSubtasksLoading } = useSubtasks()
  const { data: members = [], error: membersError, isError: isMembersError, isLoading: isMembersLoading } = useMembers()
  const { data: tags = [], error: tagsError, isError: isTagsError, isLoading: isTagsLoading } = useTags()

  const [filters, setFilters] = useState<GlobalKanbanFilters>(() => createEmptyGlobalKanbanFilters())
  const [isMobileFiltersExpanded, setIsMobileFiltersExpanded] = useState(false)

  const isLoading = isTasksLoading || isProjectsLoading || isSubtasksLoading || isMembersLoading || isTagsLoading
  const firstError = [tasksError, projectsError, subtasksError, membersError, tagsError].find((error): error is Error => error instanceof Error)
  const isError = isTasksError || isProjectsError || isSubtasksError || isMembersError || isTagsError

  const cards = useMemo(
    () => buildGlobalKanbanCards({ members, projects, subtasks, tags, tasks }),
    [members, projects, subtasks, tags, tasks],
  )
  const filteredCards = useMemo(() => filterGlobalKanbanCards(cards, filters), [cards, filters])
  const groupedColumns = useMemo(() => groupGlobalKanbanCards(filteredCards), [filteredCards])

  const updateFilter = <Key extends keyof GlobalKanbanFilters>(key: Key, value: GlobalKanbanFilters[Key]) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }))
  }

  const clearFilters = () => {
    setFilters(createEmptyGlobalKanbanFilters())
  }

  const activeFiltersLabel = isFilterStateEmpty(filters) ? 'No filters active' : 'Filters active'

  return (
    <section className="project-workspace global-kanban">
      <div className="project-workspace__header">
        <div>
          <p className="project-workspace__eyebrow">Kanban</p>
          <h2 className="project-workspace__title">Global kanban overview</h2>
          <p className="project-workspace__description">
            Review task flow across every project. Open the related project to create, edit, move, or manage tasks and subtasks.
          </p>
        </div>
      </div>

      <div className="global-tasks__filters">
        <button
          aria-controls="global-kanban-filters"
          aria-expanded={isMobileFiltersExpanded}
          className="global-tasks__filters-toggle"
          type="button"
          onClick={() => setIsMobileFiltersExpanded((currentState) => !currentState)}
        >
          <span>{isMobileFiltersExpanded ? 'Hide filters' : 'Show filters'}</span>
          <span aria-hidden="true" className={`global-tasks__filters-icon${isMobileFiltersExpanded ? ' global-tasks__filters-icon--expanded' : ''}`}>
            ▾
          </span>
        </button>

        <div
          className={`global-tasks__toolbar${isMobileFiltersExpanded ? '' : ' global-tasks__toolbar--collapsed'}`}
          id="global-kanban-filters"
          aria-label="Global kanban filters"
        >
          <label className="global-tasks__control">
            <span>Project</span>
            <select
              className="project-form__input"
              value={filters.projectId}
              onChange={(event) => updateFilter('projectId', event.target.value)}
            >
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </label>

          <label className="global-tasks__control">
            <span>Priority</span>
            <select
              className="project-form__input"
              value={filters.priority}
              onChange={(event) => updateFilter('priority', event.target.value as GlobalKanbanFilters['priority'])}
            >
              <option value="">All priorities</option>
              {Object.entries(TASK_PRIORITY_LABELS).map(([priority, label]) => (
                <option key={priority} value={priority}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="global-tasks__control">
            <span>Assignee</span>
            <select
              className="project-form__input"
              value={filters.assigneeId}
              onChange={(event) => updateFilter('assigneeId', event.target.value)}
            >
              <option value="">All assignees</option>
              <option value={UNASSIGNED_FILTER_VALUE}>Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>

          <label className="global-tasks__control">
            <span>Tag</span>
            <select className="project-form__input" value={filters.tagId} onChange={(event) => updateFilter('tagId', event.target.value)}>
              <option value="">All tags</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </label>

          <button className="project-list__button project-list__button--secondary" type="button" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      </div>

      <div className="global-tasks__summary" aria-live="polite">
        <span>{filteredCards.length} visible tasks</span>
        <span>{activeFiltersLabel}</span>
      </div>

      {isLoading ? <div className="project-state">Loading global kanban...</div> : null}

      {isError ? (
        <div className="project-state project-state--error">
          Unable to load global kanban.
          <span>{firstError?.message ?? 'Unknown error'}</span>
        </div>
      ) : null}

      {!isLoading && !isError && tasks.length === 0 ? (
        <div className="project-empty-state">
          <div>
            <p className="project-empty-state__eyebrow">No tasks yet</p>
            <h3 className="project-empty-state__title">No tasks available for the global board</h3>
            <p className="project-empty-state__description">Create tasks from a project workspace and they will appear here grouped by status.</p>
          </div>
          <Link className="project-workspace__action" to={APP_ROUTE_PATHS.projects}>
            Go to projects
          </Link>
        </div>
      ) : null}

      {!isLoading && !isError && tasks.length > 0 ? (
        <section className="project-workspace__panel project-kanban">
          <div className="project-kanban__scroll" role="region" aria-label="Global kanban board" tabIndex={0}>
            <div className="project-kanban__columns">
              {groupedColumns.map((column) => (
                <section key={column.status} className="project-workspace__panel project-kanban__column" aria-label={`${column.label} column`}>
                  <header className="member-workspace__section-header">
                    <h4>{column.label}</h4>
                    <span className="project-status">{column.cards.length}</span>
                  </header>

                  <div className="project-list project-kanban__task-list">
                    {column.cards.length === 0 ? <p className="subtask-area__empty">No tasks in this column.</p> : null}

                    {column.cards.map((card) => (
                      <article key={card.id} className="project-list__item project-kanban__task-card">
                        <div className="project-list__meta">
                          <div className="project-kanban__task-main">
                            <div className="global-kanban__top">
                              <h4 className="project-list__title global-kanban__title">{card.title}</h4>
                              <Link className="global-kanban__project-link" title={card.projectName} to={`${APP_ROUTE_PATHS.projects}/${card.projectId}`}>
                                {card.projectName}
                              </Link>
                              {card.assigneeName !== 'Unassigned' ? (
                                <p className="project-list__summary global-kanban__assignee" title={card.assigneeName}>
                                  {`Assignee: ${card.assigneeName}`}
                                </p>
                              ) : null}
                            </div>
                            <div className="project-kanban__card-meta">
                              <span className={`task-priority task-priority--${card.priority}`}>{card.priorityLabel}</span>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {!isLoading && !isError && tasks.length > 0 && filteredCards.length === 0 ? (
        <div className="project-state">
          No tasks match the current filters.
          <span>Clear filters to review all tasks in the board.</span>
        </div>
      ) : null}
    </section>
  )
}
