import { DndContext, PointerSensor, closestCenter, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useMemo, useState, type ReactNode } from 'react'
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
import { ConfirmDialog, FocusedFormDialog, useToast } from '../feedback'
import { TaskForm } from './TaskForm'
import { getTaskCardMetadata, groupTasksByKanbanColumn, hasPendingSubtasks } from './project-kanban-helpers'

type ProjectKanbanPanelProps = {
  projectId: string
}

type TaskEditorState =
  | { mode: 'create'; status: TaskStatus }
  | { mode: 'edit'; taskId: string }
  | null

type DeleteState = { task: Task } | null
type CompletionState = { task: Task; nextStatus: TaskStatus } | null

const DraggableTaskCard = ({
  children,
  id,
}: {
  children: ReactNode
  id: string
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id })

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...attributes}
      {...listeners}
      className="project-list__item project-kanban__task-card"
    >
      {children}
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
  const sensors = useSensors(useSensor(PointerSensor))
  const [editor, setEditor] = useState<TaskEditorState>(null)
  const [deleteState, setDeleteState] = useState<DeleteState>(null)
  const [completionState, setCompletionState] = useState<CompletionState>(null)
  const activeTask = editor?.mode === 'edit' ? tasks.find((task) => task.id === editor.taskId) ?? null : null

  const groupedColumns = useMemo(() => groupTasksByKanbanColumn(tasks), [tasks])
  const initialValues = useMemo(() => {
    if (editor?.mode === 'create') {
      return {
        ...createEmptyTaskFormValues(),
        status: editor.status,
      }
    }

    return activeTask === null ? createEmptyTaskFormValues() : taskToFormValues(activeTask)
  }, [activeTask, editor])

  const closeConflicts = () => {
    setDeleteState(null)
    setCompletionState(null)
  }

  const closeEditor = () => setEditor(null)

  const saveTask = async (values: TaskFormValues) => {
    if (editor?.mode === 'create') {
      await createTask.mutateAsync(createTaskInputFromFormValues(projectId, values))
      toast.success('Task created.')
      closeEditor()
      return
    }

    if (editor?.mode === 'edit') {
      await updateTask.mutateAsync({
        input: updateTaskInputFromFormValues(values),
        projectId,
        taskId: editor.taskId,
      })
      toast.success('Task updated.')
      closeEditor()
    }
  }

  const runStatusUpdate = async (task: Task, status: TaskStatus) => {
    await updateTaskStatus.mutateAsync({ projectId, status, taskId: task.id })
    toast.success('Task status updated.')
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const taskId = String(event.active.id)
    const status = event.over?.id as TaskStatus | undefined

    if (status === undefined) {
      return
    }

    const task = tasks.find((currentTask) => currentTask.id === taskId)
    if (task === undefined || task.status === status) {
      return
    }

    closeConflicts()
    setEditor(null)
    if (status === 'done' && hasPendingSubtasks(task, subtasks)) {
      setCompletionState({ nextStatus: status, task })
      return
    }

    await runStatusUpdate(task, status)
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
        description={editor?.mode === 'create' ? 'Create a top-level project task.' : 'Update this task.'}
        isOpen={editor !== null}
        onClose={closeEditor}
        title={editor?.mode === 'create' ? 'Create task' : 'Edit task'}
      >
        {editor !== null ? (
          <TaskForm
            description={editor.mode === 'create' ? 'Create a top-level project task.' : 'Update this task.'}
            initialValues={initialValues}
            isSubmitting={createTask.isPending || updateTask.isPending}
            members={members}
            onCancel={closeEditor}
            onSubmit={saveTask}
            submitLabel={editor.mode === 'create' ? 'Create task' : 'Save changes'}
            tags={tags}
            title={editor.mode === 'create' ? 'Create task' : 'Edit task'}
          />
        ) : null}
      </FocusedFormDialog>

      <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={(event) => void handleDragEnd(event)}>
        <div className="project-kanban__scroll">
          <div className="project-kanban__columns">
            {groupedColumns.map((column) => (
            <DroppableColumn key={column.status} status={column.status}>
              <div className="member-workspace__section-header">
                <h4>{column.label}</h4>
                {column.status === 'backlog' ? (
                  <button
                    className="project-list__button"
                    type="button"
                    onClick={() => {
                      closeConflicts()
                      setEditor({ mode: 'create', status: column.status })
                    }}
                  >
                    New task
                  </button>
                ) : null}
              </div>

              <div className="project-list project-kanban__task-list">
                {column.tasks.length === 0 ? <p className="subtask-area__empty">No tasks in this column.</p> : null}
                {column.tasks.map((task) => {
                  const metadata = getTaskCardMetadata(task, members, tags, subtasks)
                  const isEditing = editor?.mode === 'edit' && editor.taskId === task.id
                  if (isEditing) {
                    return null
                  }

                  return (
                    <DraggableTaskCard key={task.id} id={task.id}>
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
                      <div className="project-list__actions project-kanban__actions">
                        <button
                          aria-label="Edit task"
                          className="project-list__button project-kanban__icon-button"
                          type="button"
                          onClick={() => {
                            closeConflicts()
                            setEditor({ mode: 'edit', taskId: task.id })
                          }}
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
                          onClick={() => {
                            closeEditor()
                            setDeleteState({ task })
                          }}
                        >
                          <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
                            <path
                              d="M7 21a2 2 0 01-2-2V7h14v12a2 2 0 01-2 2H7zm3-4h2V9h-2v8zm4 0h2V9h-2v8zM9 4h6l1 2h4v2H4V6h4l1-2z"
                              fill="currentColor"
                            />
                          </svg>
                        </button>
                      </div>
                    </DraggableTaskCard>
                  )
                })}
              </div>
            </DroppableColumn>
            ))}
          </div>
        </div>
      </DndContext>

      <ConfirmDialog
        cancelLabel="Keep task"
        confirmLabel="Delete task"
        description="This removes the task and repository-managed subtasks under it."
        isOpen={deleteState !== null}
        isPending={deleteTask.isPending}
        onCancel={() => setDeleteState(null)}
        onConfirm={async () => {
          if (deleteState === null) {
            return
          }

          await deleteTask.mutateAsync({ projectId, taskId: deleteState.task.id })
          toast.success('Task deleted.')
          setDeleteState(null)
        }}
        pendingLabel="Deleting task..."
        title="Delete this task?"
      />

      <ConfirmDialog
        cancelLabel="Keep task open"
        confirmLabel="Mark done"
        description="This task has pending subtasks. You can still mark it done after confirming."
        isOpen={completionState !== null}
        isPending={updateTaskStatus.isPending}
        onCancel={() => setCompletionState(null)}
        onConfirm={async () => {
          if (completionState === null) {
            return
          }

          await runStatusUpdate(completionState.task, completionState.nextStatus)
          setCompletionState(null)
        }}
        pendingLabel="Marking done..."
        title="Mark task done with pending subtasks?"
      />
    </section>
  )
}
