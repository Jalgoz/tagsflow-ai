import { DndContext, PointerSensor, closestCenter, useDraggable, useDroppable, useSensor, useSensors, DragOverlay, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react'
import {
  createEmptyTaskFormValues,
  createTaskInputFromFormValues,
  taskToFormValues,
  updateTaskInputFromFormValues,
  useCreateTask,
  useDeleteTask,
  useMembers,
  useSubtasks,
  useTags,
  useTasksByProject,
  useUpdateTask,
  useUpdateTaskStatus,
  type TaskFormValues,
} from '../../application'
import type { Task, TaskStatus } from '../../domain'
import { requiresTaskCompletionConfirmation } from '../../domain'
import { ConfirmDialog, FocusedFormDialog, useToast } from '../feedback'
import { TagBadge } from './TagBadge'
import { TaskForm } from './TaskForm'
import { getTaskCardMetadata, getTaskDetailMetadata, groupTasksByKanbanColumn } from './project-kanban-helpers'

type ProjectKanbanPanelProps = {
  projectId: string
}

type TaskInteractionState =
  | { mode: 'create'; status: TaskStatus }
  | { mode: 'delete'; taskId: string }
  | { mode: 'detail'; taskId: string }
  | { mode: 'edit'; taskId: string }
  | { mode: 'confirm-edit'; taskId: string; values: TaskFormValues }
  | { mode: 'confirm-status'; taskId: string; nextStatus: TaskStatus }
  | null

const stopTaskCardEvent = (event: MouseEvent<HTMLButtonElement> | PointerEvent<HTMLButtonElement>) => {
  event.stopPropagation()
}

const TaskCard = ({
  task,
  metadata,
  onOpenDetail,
  onOpenEdit,
  onOpenDelete,
  isOverlay = false,
}: {
  task: Task
  metadata: ReturnType<typeof getTaskCardMetadata>
  onOpenDetail?: () => void
  onOpenEdit?: () => void
  onOpenDelete?: () => void
  isOverlay?: boolean
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
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

  return (
    <article
      ref={isOverlay ? undefined : setNodeRef}
      className={cardClassName}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
    >
      <button
        aria-label={`Open details for ${task.title}`}
        className="project-kanban__task-trigger"
        type="button"
        onClick={isOverlay ? undefined : onOpenDetail}
      >
        <div className="project-list__meta">
          <div className="project-kanban__task-main">
            <h4 className="project-list__title">{task.title}</h4>
            <div className="project-kanban__card-meta">
              {task.assigneeMemberId !== null ? (
                <p className="project-list__summary">{`Assignee: ${metadata.assignee}`}</p>
              ) : null}
              <span className={`task-priority task-priority--${task.priority}`}>
                {task.priority === 'urgent' ? (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    style={{ marginRight: 6, verticalAlign: 'text-bottom' }}
                  >
                    <path d="M12 3L2.6 20h18.8L12 3z" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 9v5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="12" cy="17" r="1.2" fill="currentColor" />
                  </svg>
                ) : null}
                {PRIORITY_LABELS[task.priority]}
              </span>
            </div>
          </div>
        </div>
      </button>

      <div className="project-list__actions project-kanban__actions">
        <button
          aria-label="Edit task"
          className="project-list__button project-kanban__icon-button"
          type="button"
          onClick={isOverlay ? undefined : onOpenEdit}
          onMouseDown={stopTaskCardEvent}
          onPointerDown={stopTaskCardEvent}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
            <path
              d="M4 20h4l10-10-4-4L4 16v4zm13.7-11.3l-2.4-2.4 1.4-1.4a1 1 0 011.4 0l1 1a1 1 0 010 1.4l-1.4 1.4z"
              fill="currentColor"
            />
          </svg>
        </button>
        <button
          aria-label="Delete task"
          className="project-list__button project-list__button--danger project-kanban__icon-button"
          type="button"
          onClick={isOverlay ? undefined : onOpenDelete}
          onMouseDown={stopTaskCardEvent}
          onPointerDown={stopTaskCardEvent}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
            <path
              d="M7 21a2 2 0 01-2-2V7h14v12a2 2 0 01-2 2H7zm3-4h2V9h-2v8zm4 0h2V9h-2v8zM9 4h6l1 2h4v2H4V6h4l1-2z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </article>
  )
}

const DroppableColumn = ({
  children,
  status,
}: {
  children: ReactNode
  status: TaskStatus
}) => {
  const { isOver, setNodeRef } = useDroppable({ id: status })

  return (
    <div ref={setNodeRef} className={`project-workspace__panel project-kanban__column ${isOver ? 'project-kanban__column--over' : ''}`}>
      {children}
    </div>
  )
}

const PRIORITY_LABELS: Record<Task['priority'], string> = {
  high: 'high',
  low: 'low',
  medium: 'medium',
  urgent: 'urgent',
}

type DetailFieldProps = {
  label: string
  value: string
}

const DetailField = ({ label, value }: DetailFieldProps) => (
  <div>
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>
)

export const ProjectKanbanPanel = ({ projectId }: ProjectKanbanPanelProps) => {
  const { data: tasks = [], error, isError, isLoading } = useTasksByProject(projectId)
  const { data: members = [] } = useMembers()
  const { data: tags = [] } = useTags()
  const { data: subtasks = [] } = useSubtasks()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const updateTaskStatus = useUpdateTaskStatus()
  const deleteTask = useDeleteTask()
  const toast = useToast()
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )
  const [interaction, setInteraction] = useState<TaskInteractionState>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const suppressedClickTaskIdRef = useRef<string | null>(null)
  const suppressedClickTimeoutRef = useRef<number | null>(null)

  const activeTask =
    interaction !== null && 'taskId' in interaction ? tasks.find((task) => task.id === interaction.taskId) ?? null : null
  const dragActiveTask = activeId ? tasks.find((t) => t.id === activeId) : null
  const dragActiveMetadata = dragActiveTask
    ? getTaskCardMetadata(dragActiveTask, members, tags, subtasks)
    : null
  const activeTaskSubtasks = useMemo(
    () => (activeTask === null ? [] : subtasks.filter((subtask) => subtask.taskId === activeTask.id)),
    [activeTask, subtasks],
  )
  const isEditorOpen = interaction?.mode === 'create' || interaction?.mode === 'edit'
  const visibleTasks = interaction?.mode === 'edit' && activeTask !== null ? tasks.filter((task) => task.id !== activeTask.id) : tasks
  const groupedColumns = useMemo(() => groupTasksByKanbanColumn(visibleTasks), [visibleTasks])
  const initialValues = useMemo(() => {
    if (interaction?.mode === 'create') {
      return {
        ...createEmptyTaskFormValues(),
        status: interaction.status,
      }
    }

    return activeTask === null ? createEmptyTaskFormValues() : taskToFormValues(activeTask)
  }, [activeTask, interaction])
  const completionConfirmation = requiresTaskCompletionConfirmation(activeTaskSubtasks)
  const detailMetadata = activeTask === null ? null : getTaskDetailMetadata(activeTask, members, tags, subtasks)

  useEffect(() => {
    return () => {
      if (suppressedClickTimeoutRef.current !== null) {
        window.clearTimeout(suppressedClickTimeoutRef.current)
      }
    }
  }, [])

  const suppressNextCardClick = (taskId: string) => {
    suppressedClickTaskIdRef.current = taskId

    if (suppressedClickTimeoutRef.current !== null) {
      window.clearTimeout(suppressedClickTimeoutRef.current)
    }

    suppressedClickTimeoutRef.current = window.setTimeout(() => {
      suppressedClickTaskIdRef.current = null
      suppressedClickTimeoutRef.current = null
    }, 180)
  }

  const openCreate = (status: TaskStatus) => {
    setInteraction({ mode: 'create', status })
  }

  const openDetail = (taskId: string) => {
    if (suppressedClickTaskIdRef.current === taskId) {
      suppressedClickTaskIdRef.current = null
      return
    }

    setInteraction({ mode: 'detail', taskId })
  }

  const openEdit = (taskId: string) => {
    setInteraction({ mode: 'edit', taskId })
  }

  const openDelete = (taskId: string) => {
    setInteraction({ mode: 'delete', taskId })
  }

  const closeInteraction = () => {
    setInteraction(null)
  }

  const runTaskUpdate = async (taskId: string, values: TaskFormValues) => {
    await updateTask.mutateAsync({
      input: updateTaskInputFromFormValues(values),
      projectId,
      taskId,
    })
    toast.success('Task updated.')
    closeInteraction()
  }

  const runStatusUpdate = async (task: Task, status: TaskStatus) => {
    await updateTaskStatus.mutateAsync({ projectId, status, taskId: task.id })
    toast.success('Task status updated.')
    closeInteraction()
  }

  const saveTask = async (values: TaskFormValues) => {
    if (interaction?.mode === 'create') {
      await createTask.mutateAsync(createTaskInputFromFormValues(projectId, values))
      toast.success('Task created.')
      closeInteraction()
      return
    }

    if (interaction?.mode !== 'edit' || activeTask === null) {
      return
    }

    if (activeTask.status !== 'done' && values.status === 'done' && completionConfirmation.requiresConfirmation) {
      setInteraction({ mode: 'confirm-edit', taskId: activeTask.id, values })
      return
    }

    await runTaskUpdate(interaction.taskId, values)
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

    if (task === undefined) {
      return
    }

    suppressNextCardClick(taskId)

    if (status === undefined || task.status === status) {
      return
    }

    if (status === 'done') {
      const taskSubtasks = subtasks.filter((subtask) => subtask.taskId === task.id)
      const statusConfirmation = requiresTaskCompletionConfirmation(taskSubtasks)

      if (statusConfirmation.requiresConfirmation) {
        setInteraction({ mode: 'confirm-status', nextStatus: status, taskId: task.id })
        return
      }
    }

    await runStatusUpdate(task, status)
  }

  const confirmDelete = async () => {
    if (activeTask === null) {
      return
    }

    await deleteTask.mutateAsync({ projectId, taskId: activeTask.id })
    toast.success('Task deleted.')
    closeInteraction()
  }

  const confirmCompletion = async () => {
    if (interaction === null || activeTask === null) {
      return
    }

    if (interaction.mode === 'confirm-edit') {
      await runTaskUpdate(interaction.taskId, interaction.values)
      return
    }

    if (interaction.mode === 'confirm-status') {
      await runStatusUpdate(activeTask, interaction.nextStatus)
    }
  }

  if (isLoading) {
    return <div className="project-state">Loading project Kanban...</div>
  }

  if (isError) {
    return (
      <div className="project-state project-state--error">
        Unable to load project Kanban.
        <span>{error instanceof Error ? error.message : 'Unknown error'}</span>
      </div>
    )
  }

  return (
    <section className="project-workspace__panel project-kanban">
      <FocusedFormDialog
        description={interaction?.mode === 'create' ? 'Create a top-level project task.' : 'Update this task.'}
        isOpen={isEditorOpen}
        onClose={closeInteraction}
        title={interaction?.mode === 'create' ? 'Create task' : 'Edit task'}
      >
        {isEditorOpen ? (
          <TaskForm
            description={interaction.mode === 'create' ? 'Create a top-level project task.' : 'Update this task.'}
            initialValues={initialValues}
            isSubmitting={createTask.isPending || updateTask.isPending}
            members={members}
            onCancel={closeInteraction}
            onSubmit={saveTask}
            submitLabel={interaction.mode === 'create' ? 'Create task' : 'Save changes'}
            tags={tags}
            title={interaction.mode === 'create' ? 'Create task' : 'Edit task'}
          />
        ) : null}
      </FocusedFormDialog>

      <FocusedFormDialog
        eyebrow="Task detail"
        description="Review task information without leaving the project Kanban."
        isOpen={interaction?.mode === 'detail' && activeTask !== null}
        onClose={closeInteraction}
        title={activeTask?.title ?? 'Task details'}
      >
        {interaction?.mode === 'detail' && activeTask !== null && detailMetadata !== null ? (
          <div className="project-kanban__detail">
            <div className="project-kanban__detail-header">
              <div className="project-kanban__detail-summary">
                <span className={`project-status project-status--${activeTask.status}`}>{detailMetadata.status}</span>
                <span className={`task-priority task-priority--${activeTask.priority}`}>{detailMetadata.priority}</span>
              </div>
              <div className="project-kanban__detail-actions">
                <button className="project-list__button" type="button" onClick={() => openEdit(activeTask.id)}>
                  Edit task
                </button>
                <button
                  className="project-list__button project-list__button--danger"
                  type="button"
                  onClick={() => openDelete(activeTask.id)}
                >
                  Delete task
                </button>
              </div>
            </div>

            <dl className="project-list__details project-kanban__detail-grid">
              <DetailField label="Assignee" value={detailMetadata.assignee} />
              <DetailField label="Start date" value={detailMetadata.startDate} />
              <DetailField label="Due date" value={detailMetadata.dueDate} />
              <DetailField label="Checklist" value={detailMetadata.checklistSummary} />
              <DetailField label="Subtask progress" value={detailMetadata.subtaskSummary} />
            </dl>

            <div className="project-kanban__detail-content">
              <div className="project-kanban__detail-section">
                <h3>Description</h3>
                <p>{detailMetadata.description}</p>
              </div>

              <div className="project-kanban__detail-section">
                <h3>In-scope content</h3>
                <p>{detailMetadata.inScopeContent}</p>
              </div>

              <div className="project-kanban__detail-section">
                <h3>Out-of-scope content</h3>
                <p>{detailMetadata.outOfScopeContent}</p>
              </div>

              <div className="project-kanban__detail-section">
                <h3>Tags</h3>
                <div className="project-kanban__detail-tags">
                  {detailMetadata.tags.length === 0 ? <p className="task-form__muted">No tags.</p> : null}
                  {detailMetadata.tags.map((tag) => (
                    <TagBadge key={tag.id} tag={tag} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </FocusedFormDialog>

      <DndContext
        collisionDetection={closestCenter}
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={(event) => void handleDragEnd(event)}
        onDragCancel={handleDragCancel}
      >
        <div className="project-kanban__scroll">
          <div className="project-kanban__columns">
            {groupedColumns.map((column) => (
              <DroppableColumn key={column.status} status={column.status}>
                <div className="member-workspace__section-header">
                  <h4>{column.label}</h4>
                  {column.status === 'backlog' ? (
                    <button className="project-list__button" type="button" onClick={() => openCreate(column.status)}>
                      New task
                    </button>
                  ) : null}
                </div>

                <div className="project-list project-kanban__task-list">
                  {column.tasks.length === 0 ? <p className="subtask-area__empty">No tasks in this column.</p> : null}
                  {column.tasks.map((task) => {
                    const metadata = getTaskCardMetadata(task, members, tags, subtasks)

                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        metadata={metadata}
                        onOpenDetail={() => openDetail(task.id)}
                        onOpenEdit={() => openEdit(task.id)}
                        onOpenDelete={() => openDelete(task.id)}
                      />
                    )
                  })}
                </div>
              </DroppableColumn>
            ))}
          </div>
        </div>

        <DragOverlay>
          {dragActiveTask && dragActiveMetadata ? (
            <TaskCard
              task={dragActiveTask}
              metadata={dragActiveMetadata}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <ConfirmDialog
        cancelLabel="Keep task"
        confirmLabel="Delete task"
        description="This removes the task and repository-managed subtasks under it."
        isOpen={interaction?.mode === 'delete' && activeTask !== null}
        isPending={deleteTask.isPending}
        onCancel={closeInteraction}
        onConfirm={confirmDelete}
        pendingLabel="Deleting task..."
        title="Delete this task?"
      />

      <ConfirmDialog
        cancelLabel="Keep task open"
        confirmLabel={interaction?.mode === 'confirm-edit' ? 'Save as done' : 'Mark done'}
        description={`This task has ${completionConfirmation.pendingSubtaskCount} pending subtasks. You can still ${
          interaction?.mode === 'confirm-edit' ? 'save it' : 'mark it'
        } done after confirming.`}
        isOpen={(interaction?.mode === 'confirm-edit' || interaction?.mode === 'confirm-status') && activeTask !== null}
        isPending={interaction?.mode === 'confirm-edit' ? updateTask.isPending : updateTaskStatus.isPending}
        onCancel={closeInteraction}
        onConfirm={confirmCompletion}
        pendingLabel={interaction?.mode === 'confirm-edit' ? 'Saving task...' : 'Marking done...'}
        title={interaction?.mode === 'confirm-edit' ? 'Save task as done with pending subtasks?' : 'Mark task done with pending subtasks?'}
      />
    </section>
  )
}
