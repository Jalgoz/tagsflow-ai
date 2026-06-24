import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMembers, useProjects, useSubtasks, useTags, useTasks, useUpdateTaskStatus } from '../../application'
import { APP_ROUTE_PATHS, TASK_PRIORITY_LABELS } from '../../shared/constants'
import { requiresTaskCompletionConfirmation, type TaskStatus } from '../../domain'
import { ConfirmDialog, useToast } from '../feedback'
import {
  UNASSIGNED_FILTER_VALUE,
  buildGlobalKanbanCards,
  createEmptyGlobalKanbanFilters,
  filterGlobalKanbanCards,
  groupGlobalKanbanCards,
  type GlobalKanbanCard,
  type GlobalKanbanFilters,
} from './global-kanban'
import { TaskDetailReadonlyDialog } from '../components/TaskDetailReadonlyDialog'
import { getTaskDetailMetadata } from '../components/project-kanban-helpers'

const isFilterStateEmpty = (filters: GlobalKanbanFilters): boolean =>
  filters.projectId === '' && filters.priority === '' && filters.assigneeId === '' && filters.tagId === ''

const DroppableColumn = ({
  children,
  status,
  label,
}: {
  children: React.ReactNode
  status: TaskStatus
  label: string
}) => {
  const { isOver, setNodeRef } = useDroppable({ id: status })

  return (
    <section
      ref={setNodeRef}
      className={`project-workspace__panel project-kanban__column ${isOver ? 'project-kanban__column--over' : ''}`}
      aria-label={`${label} column`}
    >
      {children}
    </section>
  )
}

const DraggableTaskCard = ({
  card,
  isOverlay = false,
  onOpenDetail,
}: {
  card: GlobalKanbanCard
  isOverlay?: boolean
  onOpenDetail?: () => void
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    disabled: isOverlay,
  })

  const cardClassName = [
    'project-list__item',
    'project-kanban__task-card',
    isOverlay ? 'project-kanban__task-card--overlay' : '',
    isDragging && !isOverlay ? 'project-kanban__task-card--dragging-source' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.global-kanban__project-link')) {
      return
    }
    onOpenDetail?.()
  }

  return (
    <article
      ref={isOverlay ? undefined : setNodeRef}
      className={cardClassName}
      style={{ cursor: 'pointer' }}
      onClick={isOverlay ? undefined : handleClick}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
    >
      <div className="project-list__meta">
        <div className="project-kanban__task-main">
          <div className="global-kanban__top">
            <h4 className="project-list__title global-kanban__title">{card.title}</h4>
            <Link
              className="global-kanban__project-link"
              title={card.projectName}
              to={`${APP_ROUTE_PATHS.projects}/${card.projectId}`}
              onPointerDown={(e) => e.stopPropagation()}
            >
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
  )
}

type TaskInteractionState =
  | { mode: 'confirm-status'; taskId: string; nextStatus: TaskStatus; projectId: string }
  | { mode: 'detail'; taskId: string }
  | null

export const KanbanPage = () => {
  const { data: tasks = [], error: tasksError, isError: isTasksError, isLoading: isTasksLoading } = useTasks()
  const { data: projects = [], error: projectsError, isError: isProjectsError, isLoading: isProjectsLoading } = useProjects()
  const { data: subtasks = [], error: subtasksError, isError: isSubtasksError, isLoading: isSubtasksLoading } = useSubtasks()
  const { data: members = [], error: membersError, isError: isMembersError, isLoading: isMembersLoading } = useMembers()
  const { data: tags = [], error: tagsError, isError: isTagsError, isLoading: isTagsLoading } = useTags()
  
  const updateTaskStatus = useUpdateTaskStatus()
  const toast = useToast()
  const navigate = useNavigate()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const [filters, setFilters] = useState<GlobalKanbanFilters>(() => createEmptyGlobalKanbanFilters())
  const [isMobileFiltersExpanded, setIsMobileFiltersExpanded] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [interaction, setInteraction] = useState<TaskInteractionState>(null)

  const isLoading = isTasksLoading || isProjectsLoading || isSubtasksLoading || isMembersLoading || isTagsLoading
  const firstError = [tasksError, projectsError, subtasksError, membersError, tagsError].find((error): error is Error => error instanceof Error)
  const isError = isTasksError || isProjectsError || isSubtasksError || isMembersError || isTagsError

  const cards = useMemo(
    () => buildGlobalKanbanCards({ members, projects, subtasks, tags, tasks }),
    [members, projects, subtasks, tags, tasks],
  )
  const filteredCards = useMemo(() => filterGlobalKanbanCards(cards, filters), [cards, filters])
  const groupedColumns = useMemo(() => groupGlobalKanbanCards(filteredCards), [filteredCards])

  const dragActiveCard = activeId ? cards.find((c) => c.id === activeId) : null
  const activeTask = interaction !== null ? tasks.find((t) => t.id === interaction.taskId) ?? null : null
  const activeTaskSubtasks = useMemo(
    () => (activeTask === null ? [] : subtasks.filter((subtask) => subtask.taskId === activeTask.id)),
    [activeTask, subtasks],
  )
  const completionConfirmation = requiresTaskCompletionConfirmation(activeTaskSubtasks)
  const detailMetadata = activeTask === null ? null : getTaskDetailMetadata(activeTask, members, tags, subtasks)

  const updateFilter = <Key extends keyof GlobalKanbanFilters>(key: Key, value: GlobalKanbanFilters[Key]) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }))
  }

  const clearFilters = () => {
    setFilters(createEmptyGlobalKanbanFilters())
  }
  
  const closeInteraction = () => setInteraction(null)

  const runStatusUpdate = async (taskId: string, projectId: string, status: TaskStatus) => {
    await updateTaskStatus.mutateAsync({ projectId, status, taskId })
    toast.success('Task status updated.')
    closeInteraction()
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const taskId = String(event.active.id)
    const status = event.over?.id as TaskStatus | undefined
    const task = tasks.find((currentTask) => currentTask.id === taskId)

    if (task === undefined || status === undefined || task.status === status) {
      return
    }

    if (status === 'done') {
      const taskSubtasks = subtasks.filter((subtask) => subtask.taskId === task.id)
      const statusConfirmation = requiresTaskCompletionConfirmation(taskSubtasks)

      if (statusConfirmation.requiresConfirmation) {
        setInteraction({ mode: 'confirm-status', nextStatus: status, taskId: task.id, projectId: task.projectId })
        return
      }
    }

    await runStatusUpdate(task.id, task.projectId, status)
  }

  const confirmCompletion = async () => {
    if (interaction === null || interaction.mode !== 'confirm-status' || activeTask === null) {
      return
    }
    await runStatusUpdate(activeTask.id, activeTask.projectId, interaction.nextStatus)
  }

  const activeFiltersLabel = isFilterStateEmpty(filters) ? 'No filters active' : 'Filters active'

  return (
    <section className="project-workspace global-kanban">
      <div className="project-workspace__header">
        <div>
          <p className="project-workspace__eyebrow">Kanban</p>
          <h2 className="project-workspace__title">Global kanban overview</h2>
          <p className="project-workspace__description">
            Review task flow across every project. Drag and drop tasks to update their status. Open a project to create or edit details.
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
          <DndContext
            collisionDetection={closestCenter}
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={(event) => void handleDragEnd(event)}
            onDragCancel={handleDragCancel}
          >
            <div className="project-kanban__scroll" role="region" aria-label="Global kanban board" tabIndex={0}>
              <div className="project-kanban__columns">
                {groupedColumns.map((column) => (
                  <DroppableColumn key={column.status} status={column.status} label={column.label}>
                    <header className="member-workspace__section-header">
                      <h4>{column.label}</h4>
                      <span className="project-status">{column.cards.length}</span>
                    </header>

                    <div className="project-list project-kanban__task-list">
                      {column.cards.length === 0 ? <p className="subtask-area__empty">No tasks in this column.</p> : null}

                      {column.cards.map((card) => (
                        <DraggableTaskCard key={card.id} card={card} onOpenDetail={() => setInteraction({ mode: 'detail', taskId: card.id })} />
                      ))}
                    </div>
                  </DroppableColumn>
                ))}
              </div>
            </div>
            <DragOverlay dropAnimation={null}>
              {dragActiveCard ? <DraggableTaskCard card={dragActiveCard} isOverlay /> : null}
            </DragOverlay>
          </DndContext>
          
          <ConfirmDialog
            cancelLabel="Keep task open"
            confirmLabel="Mark done"
            description={`This task has ${completionConfirmation.pendingSubtaskCount} pending subtasks. You can still mark it done after confirming.`}
            isOpen={interaction?.mode === 'confirm-status' && activeTask !== null}
            isPending={updateTaskStatus.isPending}
            onCancel={closeInteraction}
            onConfirm={confirmCompletion}
            pendingLabel="Marking done..."
            title="Mark task done with pending subtasks?"
          />
          <TaskDetailReadonlyDialog
            activeTask={activeTask}
            detailMetadata={detailMetadata}
            activeTaskSubtasks={activeTaskSubtasks}
            isOpen={interaction?.mode === 'detail' && activeTask !== null}
            onClose={closeInteraction}
            members={members}
            tags={tags}
            headerActions={
              activeTask !== null ? (
                <div className="focused-form-dialog__header-actions project-kanban__detail-header-actions">
                  <button
                    aria-label="Go to task"
                    className="project-list__button project-kanban__icon-button"
                    title="Go to task"
                    type="button"
                    onClick={() => {
                      closeInteraction()
                      navigate(`${APP_ROUTE_PATHS.tasks}?taskSearch=${encodeURIComponent(activeTask.title)}`)
                    }}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
                      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" fill="currentColor" />
                    </svg>
                  </button>
                  <button
                    aria-label="Close"
                    className="project-list__button project-list__button--secondary project-kanban__icon-button"
                    type="button"
                    onClick={closeInteraction}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
                      <path
                        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                </div>
              ) : undefined
            }
          />
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
