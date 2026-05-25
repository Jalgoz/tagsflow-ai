import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  taskToFormValues,
  updateTaskInputFromFormValues,
  useDeleteTask,
  useMembers,
  useProjects,
  useSubtasks,
  useTags,
  useTasks,
  useUpdateTask,
  type TaskFormValues,
} from '../../application'
import type { Task } from '../../domain'
import { requiresTaskCompletionConfirmation } from '../../domain'
import { APP_ROUTE_PATHS, TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '../../shared/constants'
import { TagBadge } from '../components/TagBadge'
import { TaskForm } from '../components/TaskForm'
import { ConfirmDialog, FocusedFormDialog, useToast } from '../feedback'
import {
  DEFAULT_UPCOMING_DEADLINE_WINDOW_DAYS,
  UNASSIGNED_FILTER_VALUE,
  applyGlobalTaskView,
  buildGlobalTaskRows,
  createEmptyGlobalTaskFilters,
  type GlobalTaskFilters,
  type GlobalTaskRow,
  type GlobalTaskSort,
} from './global-tasks'

type CompletionConfirmationState = {
  task: Task
  values: TaskFormValues
}

const formatDate = (value: string | null): string => {
  if (value === null || value.trim() === '') {
    return 'Not set'
  }

  return value
}

const formatChecklist = (summary: { completed: number; total: number }): string => {
  if (summary.total === 0) {
    return 'No checklist'
  }

  return `${summary.completed}/${summary.total} done`
}

const formatSubtaskProgress = (row: GlobalTaskRow): string => {
  if (row.subtaskProgress.total === 0) {
    return 'No subtasks'
  }

  return `${row.subtaskProgress.completed}/${row.subtaskProgress.total} subtasks done`
}

const getReferenceDate = (): string => new Date().toISOString().slice(0, 10)

const isFilterStateEmpty = (filters: GlobalTaskFilters): boolean =>
  filters.projectId === '' &&
  filters.status === '' &&
  filters.priority === '' &&
  filters.assigneeId === '' &&
  filters.tagId === '' &&
  !filters.overdueOnly &&
  !filters.upcomingOnly

export const TasksPage = () => {
  const { data: tasks = [], error: tasksError, isError: isTasksError, isLoading: isTasksLoading } = useTasks()
  const { data: projects = [], error: projectsError, isError: isProjectsError, isLoading: isProjectsLoading } = useProjects()
  const { data: subtasks = [], error: subtasksError, isError: isSubtasksError, isLoading: isSubtasksLoading } = useSubtasks()
  const { data: members = [], error: membersError, isError: isMembersError, isLoading: isMembersLoading } = useMembers()
  const { data: tags = [], error: tagsError, isError: isTagsError, isLoading: isTagsLoading } = useTags()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const toast = useToast()

  const [searchText, setSearchText] = useState('')
  const [filters, setFilters] = useState<GlobalTaskFilters>(() => createEmptyGlobalTaskFilters())
  const [sort, setSort] = useState<GlobalTaskSort>({ direction: 'asc', field: 'dueDate' })
  const [isMobileFiltersExpanded, setIsMobileFiltersExpanded] = useState(false)
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(() => new Set())
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [deleteState, setDeleteState] = useState<Task | null>(null)
  const [completionConfirmation, setCompletionConfirmation] = useState<CompletionConfirmationState | null>(null)

  const isLoading = isTasksLoading || isProjectsLoading || isSubtasksLoading || isMembersLoading || isTagsLoading
  const firstError = [tasksError, projectsError, subtasksError, membersError, tagsError].find(
    (error): error is Error => error instanceof Error,
  )
  const isError = isTasksError || isProjectsError || isSubtasksError || isMembersError || isTagsError
  const referenceDate = useMemo(() => getReferenceDate(), [])

  const rows = useMemo(
    () => buildGlobalTaskRows({ members, projects, subtasks, tags, tasks }),
    [members, projects, subtasks, tags, tasks],
  )
  const visibleRows = useMemo(
    () => applyGlobalTaskView(rows, filters, searchText, sort, referenceDate),
    [filters, referenceDate, rows, searchText, sort],
  )

  const activeTask = editingTaskId === null ? null : tasks.find((task) => task.id === editingTaskId) ?? null

  const updateFilter = <Key extends keyof GlobalTaskFilters>(key: Key, value: GlobalTaskFilters[Key]) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }))
  }

  const clearFilters = () => {
    setFilters(createEmptyGlobalTaskFilters())
  }

  const toggleExpanded = (taskId: string) => {
    setExpandedTaskIds((currentIds) => {
      const nextIds = new Set(currentIds)

      if (nextIds.has(taskId)) {
        nextIds.delete(taskId)
      } else {
        nextIds.add(taskId)
      }

      return nextIds
    })
  }

  const closeTaskStates = () => {
    setEditingTaskId(null)
    setDeleteState(null)
    setCompletionConfirmation(null)
  }

  const openEdit = (taskId: string) => {
    setDeleteState(null)
    setCompletionConfirmation(null)
    setEditingTaskId(taskId)
  }

  const openDelete = (task: Task) => {
    setEditingTaskId(null)
    setCompletionConfirmation(null)
    setDeleteState(task)
  }

  const saveTask = async (task: Task, values: TaskFormValues) => {
    const input = updateTaskInputFromFormValues(values)
    await updateTask.mutateAsync({ input, projectId: task.projectId, taskId: task.id })
    toast.success('Task updated.')
    closeTaskStates()
  }

  const submitTaskEdit = async (values: TaskFormValues) => {
    if (activeTask === null) {
      return
    }

    if (activeTask.status !== 'done' && values.status === 'done') {
      const activeSubtasks = subtasks.filter((subtask) => subtask.taskId === activeTask.id)
      const confirmation = requiresTaskCompletionConfirmation(activeSubtasks)

      if (confirmation.requiresConfirmation) {
        setCompletionConfirmation({ task: activeTask, values })
        return
      }
    }

    await saveTask(activeTask, values)
  }

  const confirmPendingCompletion = async () => {
    if (completionConfirmation === null) {
      return
    }

    await saveTask(completionConfirmation.task, completionConfirmation.values)
  }

  const confirmDelete = async () => {
    if (deleteState === null) {
      return
    }

    await deleteTask.mutateAsync({ projectId: deleteState.projectId, taskId: deleteState.id })
    toast.success('Task deleted.')
    closeTaskStates()
  }

  const activeFiltersLabel = isFilterStateEmpty(filters) ? 'No filters active' : 'Filters active'

  return (
    <section className="project-workspace global-tasks">
      <div className="project-workspace__header">
        <div>
          <p className="project-workspace__eyebrow">Tasks</p>
          <h2 className="project-workspace__title">Global tasks view</h2>
          <p className="project-workspace__description">
            Review and maintain existing tasks across every local project. Create new tasks from a project workspace.
          </p>
        </div>
        <Link className="project-workspace__action" to={APP_ROUTE_PATHS.projects}>
          Choose project
        </Link>
      </div>

      <div className="global-tasks__filters">
        <button
          aria-controls="global-task-controls"
          aria-expanded={isMobileFiltersExpanded}
          className="global-tasks__filters-toggle"
          type="button"
          onClick={() => setIsMobileFiltersExpanded((currentState) => !currentState)}
        >
          {isMobileFiltersExpanded ? 'Hide filters' : 'Show filters'}
        </button>

        <div
          className={`global-tasks__toolbar${isMobileFiltersExpanded ? '' : ' global-tasks__toolbar--collapsed'}`}
          id="global-task-controls"
          aria-label="Global task controls"
        >
        <label className="global-tasks__control global-tasks__control--wide">
          <span>Search</span>
          <input
            className="project-form__input"
            placeholder="Search title or description"
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </label>

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
          <span>Status</span>
          <select
            className="project-form__input"
            value={filters.status}
            onChange={(event) => updateFilter('status', event.target.value as GlobalTaskFilters['status'])}
          >
            <option value="">All statuses</option>
            {Object.entries(TASK_STATUS_LABELS).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="global-tasks__control">
          <span>Priority</span>
          <select
            className="project-form__input"
            value={filters.priority}
            onChange={(event) => updateFilter('priority', event.target.value as GlobalTaskFilters['priority'])}
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

        <label className="global-tasks__control">
          <span>Sort</span>
          <select
            className="project-form__input"
            value={sort.field}
            onChange={(event) => setSort((currentSort) => ({ ...currentSort, field: event.target.value as GlobalTaskSort['field'] }))}
          >
            <option value="dueDate">Due date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
            <option value="project">Project</option>
            <option value="title">Title</option>
          </select>
        </label>

        <label className="global-tasks__control">
          <span>Direction</span>
          <select
            className="project-form__input"
            value={sort.direction}
            onChange={(event) => setSort((currentSort) => ({ ...currentSort, direction: event.target.value as GlobalTaskSort['direction'] }))}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>

        <div className="global-tasks__toggle-group" aria-label="Deadline filters">
          <label className="global-tasks__toggle">
            <input
              checked={filters.overdueOnly}
              type="checkbox"
              onChange={(event) => updateFilter('overdueOnly', event.target.checked)}
            />
            Overdue
          </label>
          <label className="global-tasks__toggle">
            <input
              checked={filters.upcomingOnly}
              type="checkbox"
              onChange={(event) => updateFilter('upcomingOnly', event.target.checked)}
            />
            Next {DEFAULT_UPCOMING_DEADLINE_WINDOW_DAYS} days
          </label>
        </div>

        <button className="project-list__button project-list__button--secondary" type="button" onClick={clearFilters}>
          Clear filters
        </button>
        </div>
      </div>

      <div className="global-tasks__summary" aria-live="polite">
        <span>{visibleRows.length} visible tasks</span>
        <span>{activeFiltersLabel}</span>
      </div>

      {isLoading ? <div className="project-state">Loading tasks...</div> : null}

      {isError ? (
        <div className="project-state project-state--error">
          Unable to load global tasks.
          <span>{firstError?.message ?? 'Unknown error'}</span>
        </div>
      ) : null}

      {!isLoading && !isError && tasks.length === 0 ? (
        <div className="project-empty-state">
          <div>
            <p className="project-empty-state__eyebrow">No tasks yet</p>
            <h3 className="project-empty-state__title">Create tasks from a project</h3>
            <p className="project-empty-state__description">
              Global Tasks is for reviewing existing work. Open a project workspace to create the first task.
            </p>
          </div>
          <Link className="project-workspace__action" to={APP_ROUTE_PATHS.projects}>
            Choose project
          </Link>
        </div>
      ) : null}

      {!isLoading && !isError && tasks.length > 0 && visibleRows.length === 0 ? (
        <div className="project-state">
          No tasks match the current search and filters.
          <span>Adjust the controls or clear filters to review all existing tasks.</span>
        </div>
      ) : null}

      {!isLoading && !isError && visibleRows.length > 0 ? (
        <div className="global-tasks__list">
          {visibleRows.map((row) => {
            const isExpanded = expandedTaskIds.has(row.id)
            const isEditing = editingTaskId === row.id

            if (isEditing) {
              return null
            }

            return (
              <article key={row.id} className="global-task-card">
                <div className="global-task-card__main">
                  <div className="global-task-card__title-row">
                    <div>
                      <h3 className="global-task-card__title">{row.title}</h3>
                      <p className="global-task-card__project">{row.projectName}</p>
                    </div>
                    <div className="global-task-card__badges">
                      <span className={`project-status project-status--${row.status}`}>{TASK_STATUS_LABELS[row.status]}</span>
                      <span className={`task-priority task-priority--${row.priority}`}>{TASK_PRIORITY_LABELS[row.priority]}</span>
                    </div>
                  </div>

                  <dl className="global-task-card__details">
                    <div>
                      <dt>Start</dt>
                      <dd>{formatDate(row.startDate)}</dd>
                    </div>
                    <div>
                      <dt>Due</dt>
                      <dd>{formatDate(row.dueDate)}</dd>
                    </div>
                    <div>
                      <dt>Assignee</dt>
                      <dd>{row.assignee?.name ?? 'Unassigned'}</dd>
                    </div>
                    <div>
                      <dt>Checklist</dt>
                      <dd>{formatChecklist(row.checklistSummary)}</dd>
                    </div>
                    <div>
                      <dt>Subtasks</dt>
                      <dd>{formatSubtaskProgress(row)}</dd>
                    </div>
                    <div>
                      <dt>Progress</dt>
                      <dd>{Math.round(row.taskProgress)}%</dd>
                    </div>
                  </dl>

                  <div className="global-task-card__tags">
                    {row.tags.length === 0 ? <span className="global-task-card__muted">No tags</span> : null}
                    {row.tags.map((tag) => (
                      <TagBadge key={tag.id} tag={tag} />
                    ))}
                  </div>
                </div>

                <div className="global-task-card__actions">
                  <button className="project-list__button project-list__button--secondary" type="button" onClick={() => toggleExpanded(row.id)}>
                    {isExpanded ? 'Hide subtasks' : 'Show subtasks'}
                  </button>
                  <button className="project-list__button project-list__button--secondary" type="button" onClick={() => openEdit(row.id)}>
                    Edit
                  </button>
                  <button className="project-list__button project-list__button--danger" type="button" onClick={() => openDelete(row.task)}>
                    Delete
                  </button>
                </div>

                {isExpanded ? (
                  <div className="global-task-card__subtasks">
                    <h4>Subtasks</h4>
                    {row.subtasks.length === 0 ? <p className="global-task-card__muted">No subtasks for this task.</p> : null}
                    {row.subtasks.length > 0 ? (
                      <div className="global-subtask-list">
                        {row.subtasks.map((subtask) => (
                          <div key={subtask.id} className="global-subtask-list__item">
                            <div>
                              <strong>{subtask.title}</strong>
                              <span>{subtask.assignee?.name ?? 'Unassigned'}</span>
                            </div>
                            <span className={`project-status project-status--${subtask.status}`}>{TASK_STATUS_LABELS[subtask.status]}</span>
                            <span className={`task-priority task-priority--${subtask.priority}`}>{TASK_PRIORITY_LABELS[subtask.priority]}</span>
                            <span>Due {formatDate(subtask.dueDate)}</span>
                            <span>{formatChecklist(subtask.checklistSummary)}</span>
                            <div className="global-subtask-list__tags">
                              {subtask.tags.length === 0 ? <span>No tags</span> : null}
                              {subtask.tags.map((tag) => (
                                <TagBadge key={tag.id} tag={tag} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      ) : null}

      <FocusedFormDialog
        description={activeTask === null ? undefined : `Update ${activeTask.title} from the global tasks view.`}
        isOpen={activeTask !== null}
        title="Edit global task"
        onClose={closeTaskStates}
      >
        {activeTask !== null ? (
          <TaskForm
            cancelLabel="Cancel"
            description="Changes are saved to the task's project workspace."
            initialValues={taskToFormValues(activeTask)}
            isSubmitting={updateTask.isPending}
            members={members}
            submitLabel="Save changes"
            tags={tags}
            title="Edit task"
            onCancel={closeTaskStates}
            onSubmit={submitTaskEdit}
          />
        ) : null}
      </FocusedFormDialog>

      <ConfirmDialog
        confirmLabel="Delete task"
        description={deleteState === null ? '' : `Delete "${deleteState.title}" and use the existing task cleanup behavior.`}
        isOpen={deleteState !== null}
        isPending={deleteTask.isPending}
        pendingLabel="Deleting task..."
        title="Delete task?"
        onCancel={closeTaskStates}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        confirmLabel="Save as done"
        description={
          completionConfirmation === null
            ? ''
            : `This task has pending subtasks. You can still save it as done after confirming.`
        }
        isOpen={completionConfirmation !== null}
        isPending={updateTask.isPending}
        pendingLabel="Saving task..."
        title="Save task as done with pending subtasks?"
        onCancel={() => setCompletionConfirmation(null)}
        onConfirm={confirmPendingCompletion}
      />
    </section>
  )
}
