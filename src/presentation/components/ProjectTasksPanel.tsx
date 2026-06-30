import { useMemo, useState } from 'react'
import {
  createEmptyTaskFormValues,
  createTaskInputFromFormValues,
  taskToFormValues,
  updateTaskInputFromFormValues,
  useCreateTask,
  useDeleteTask,
  useMembers,
  useSubtasksByTask,
  useTags,
  useTasksByProject,
  useUpdateTask,
  useUpdateTaskStatus,
  type TaskFormValues,
} from '../../application'
import type { Member, Subtask, Tag, Task, TaskStatus } from '../../domain'
import { requiresTaskCompletionConfirmation } from '../../domain'
import { ConfirmDialog, FocusedFormDialog, useToast } from '../feedback'
import { AIPrioritySuggestionDialog } from './AIPrioritySuggestionDialog'
import { TagBadge } from './TagBadge'
import { TaskCardActions } from './TaskCardActions'
import { TaskForm } from './TaskForm'
import { TaskSubtaskArea } from './TaskSubtaskArea'
import { TaskFilterToolbar } from './TaskFilterToolbar'

type ProjectTasksPanelProps = {
  projectId: string
}

type TaskEditorState =
  | {
      mode: 'create'
    }
  | {
      mode: 'edit'
      taskId: string
    }
  | null

type TaskDeleteState = {
  task: Task
}

type CompletionState =
  | {
      mode: 'status'
      task: Task
      nextStatus: TaskStatus
    }
  | {
      mode: 'edit'
      task: Task
      values: TaskFormValues
    }
  | null

const formatDate = (value: string | null): string => {
  if (value === null || value.trim() === '') {
    return 'Not set'
  }

  return value
}

const formatStatus = (status: TaskStatus): string => {
  const labels: Record<TaskStatus, string> = {
    backlog: 'Backlog',
    todo: 'To Do',
    in_progress: 'In Progress',
    blocked: 'Blocked',
    review: 'Review',
    done: 'Done',
  }

  return labels[status]
}

const findMemberName = (members: Member[], memberId: string | null): string => {
  if (memberId === null) {
    return 'Unassigned'
  }

  return members.find((member) => member.id === memberId)?.name ?? 'Unknown member'
}

const findTaskTags = (tags: Tag[], tagIds: string[]): Tag[] => {
  const tagIdSet = new Set(tagIds)

  return tags.filter((tag) => tagIdSet.has(tag.id))
}

const checklistSummary = (items: Array<{ completed: boolean }>): string => {
  if (items.length === 0) {
    return 'No checklist'
  }

  const completedCount = items.filter((item) => item.completed).length

  return `${completedCount}/${items.length} complete`
}

const getCompletionConfirmation = (task: Task, subtasks: Subtask[]) => {
  const confirmation = requiresTaskCompletionConfirmation(subtasks)

  if (confirmation.requiresConfirmation || subtasks.length > 0 || task.subtaskIds.length === 0) {
    return confirmation
  }

  return {
    pendingSubtaskCount: task.subtaskIds.length,
    requiresConfirmation: true,
  }
}

type TaskCardProps = {
  isExpanded: boolean
  isEditing: boolean
  members: Member[]
  onCloseConflictingTaskStates: () => void
  onDeleteTask: (task: Task) => void
  onEditTask: (taskId: string) => void
  onSuggestPriority: (taskId: string) => void
  onToggleExpanded: (taskId: string) => void
  projectId: string
  tags: Tag[]
  task: Task
}

const TaskCard = ({
  isExpanded,
  isEditing,
  members,
  onCloseConflictingTaskStates,
  onDeleteTask,
  onEditTask,
  onSuggestPriority,
  onToggleExpanded,
  projectId,
  tags,
  task,
}: TaskCardProps) => {
  const { data: subtasks = [] } = useSubtasksByTask(task.id)
  const updateTaskStatus = useUpdateTaskStatus()
  const toast = useToast()
  const [completionState, setCompletionState] = useState<CompletionState>(null)

  const requestTaskStatusChange = async (nextStatus: TaskStatus) => {
    if (nextStatus === task.status) {
      return
    }

    const confirmation = getCompletionConfirmation(task, subtasks)

    if (nextStatus === 'done' && confirmation.requiresConfirmation) {
      onCloseConflictingTaskStates()
      setCompletionState({ mode: 'status', nextStatus, task })
      return
    }

    await updateTaskStatus.mutateAsync({ projectId, status: nextStatus, taskId: task.id })
    toast.success('Task status updated.')
  }

  const confirmCompletion = async () => {
    if (completionState === null || completionState.mode !== 'status') {
      return
    }

    await updateTaskStatus.mutateAsync({
      projectId,
      status: completionState.nextStatus,
      taskId: completionState.task.id,
    })
    toast.success('Task status updated.')
    setCompletionState(null)
  }

  if (isEditing) {
    return null
  }

  const visibleTags = findTaskTags(tags, task.tagIds)

  return (
    <article className="project-list__item task-card">
      <div className="project-list__meta">
        <div className="project-list__title-row task-card__title-row">
          <div>
            <h4 className="project-list__title">{task.title}</h4>
            <p className="project-list__summary">{task.description || 'No description provided.'}</p>
          </div>
          <span className={`project-status project-status--${task.status}`}>{formatStatus(task.status)}</span>
        </div>

        <dl className="project-list__details task-card__details">
          <div>
            <dt>Priority</dt>
            <dd>{task.priority}</dd>
          </div>
          <div>
            <dt>Start</dt>
            <dd>{formatDate(task.startDate)}</dd>
          </div>
          <div>
            <dt>Due</dt>
            <dd>{formatDate(task.dueDate)}</dd>
          </div>
          <div>
            <dt>Assignee</dt>
            <dd>{findMemberName(members, task.assigneeMemberId)}</dd>
          </div>
          <div>
            <dt>Checklist</dt>
            <dd>{checklistSummary(task.checklist)}</dd>
          </div>
          <div>
            <dt>Subtasks</dt>
            <dd>{subtasks.length}</dd>
          </div>
        </dl>

        <div className="task-card__tags">
          {visibleTags.length === 0 ? <span className="task-form__muted">No tags</span> : null}
          {visibleTags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>

        <div className="task-card__scope">
          <div>
            <span>In scope</span>
            <p>{task.inScopeContent || 'Not set.'}</p>
          </div>
          <div>
            <span>Out of scope</span>
            <p>{task.outOfScopeContent || 'Not set.'}</p>
          </div>
        </div>
      </div>

      <div className="project-list__actions task-card__actions">
        <select
          aria-label={`Update status for ${task.title}`}
          className="project-form__input task-card__status-select"
          value={task.status}
          onChange={(event) => void requestTaskStatusChange(event.target.value as TaskStatus)}
        >
          <option value="backlog">Backlog</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
        <TaskCardActions
          isExpanded={isExpanded}
          onDelete={() => onDeleteTask(task)}
          onEdit={() => onEditTask(task.id)}
          onSuggestPriority={() => onSuggestPriority(task.id)}
          onToggleExpanded={() => onToggleExpanded(task.id)}
        />
      </div>

      {isExpanded ? <TaskSubtaskArea members={members} tags={tags} task={task} /> : null}

      <ConfirmDialog
        cancelLabel="Keep task open"
        confirmLabel="Mark done"
        description={`This task has ${getCompletionConfirmation(task, subtasks).pendingSubtaskCount} pending subtasks. You can still mark it done after confirming.`}
        isOpen={completionState !== null}
        isPending={updateTaskStatus.isPending}
        onCancel={() => setCompletionState(null)}
        onConfirm={confirmCompletion}
        pendingLabel="Marking done..."
        title="Mark task done with pending subtasks?"
      />
    </article>
  )
}

export const ProjectTasksPanel = ({ projectId }: ProjectTasksPanelProps) => {
  const { data: tasks = [], error, isError, isLoading } = useTasksByProject(projectId)
  const { data: members = [] } = useMembers()
  const { data: tags = [] } = useTags()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const toast = useToast()
  const [editor, setEditor] = useState<TaskEditorState>(null)
  const [deleteState, setDeleteState] = useState<TaskDeleteState | null>(null)
  const [editCompletionState, setEditCompletionState] = useState<CompletionState>(null)
  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>([])
  const [prioritySuggestionTaskId, setPrioritySuggestionTaskId] = useState<string | null>(null)
  const [filterAssigneeId, setFilterAssigneeId] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')

  const activeTask = editor?.mode === 'edit' ? tasks.find((task) => task.id === editor.taskId) ?? null : null
  const { data: activeTaskSubtasks = [] } = useSubtasksByTask(activeTask?.id)

  const filteredTasks = useMemo(() => {
    let result = tasks

    if (filterAssigneeId !== '') {
      if (filterAssigneeId === '__unassigned__') {
        result = result.filter((task) => task.assigneeMemberId === null)
      } else {
        result = result.filter((task) => task.assigneeMemberId === filterAssigneeId)
      }
    }

    if (filterPriority !== '') {
      result = result.filter((task) => task.priority === filterPriority)
    }

    return result
  }, [tasks, filterAssigneeId, filterPriority])

  const visibleTasks =
    editor?.mode === 'edit' && activeTask !== null ? filteredTasks.filter((task) => task.id !== activeTask.id) : filteredTasks
  const initialValues = useMemo(
    () => (editor?.mode === 'edit' && activeTask !== null ? taskToFormValues(activeTask) : createEmptyTaskFormValues()),
    [activeTask, editor?.mode],
  )

  const closeTaskStates = () => {
    setEditor(null)
    setDeleteState(null)
    setEditCompletionState(null)
    setPrioritySuggestionTaskId(null)
  }

  const startCreate = () => {
    setDeleteState(null)
    setPrioritySuggestionTaskId(null)
    setEditor({ mode: 'create' })
  }

  const startEdit = (taskId: string) => {
    setDeleteState(null)
    setPrioritySuggestionTaskId(null)
    setEditor({ mode: 'edit', taskId })
  }

  const requestDelete = (task: Task) => {
    setEditor(null)
    setPrioritySuggestionTaskId(null)
    setEditCompletionState(null)
    setDeleteState({ task })
  }

  const requestPrioritySuggestion = (taskId: string) => {
    setEditor(null)
    setDeleteState(null)
    setEditCompletionState(null)
    setPrioritySuggestionTaskId(taskId)
  }

  const confirmDelete = async () => {
    if (deleteState === null) {
      return
    }

    await deleteTask.mutateAsync({ projectId, taskId: deleteState.task.id })
    toast.success('Task deleted.')
    setDeleteState(null)
  }

  const saveTask = async (values: TaskFormValues) => {
    if (editor?.mode === 'create') {
      await createTask.mutateAsync(createTaskInputFromFormValues(projectId, values))
      toast.success('Task created.')
      setEditor(null)
      return
    }

    if (editor?.mode === 'edit') {
      if (activeTask !== null && activeTask.status !== 'done' && values.status === 'done') {
        const confirmation = getCompletionConfirmation(activeTask, activeTaskSubtasks)

        if (confirmation.requiresConfirmation) {
          setDeleteState(null)
          setEditCompletionState({ mode: 'edit', task: activeTask, values })
          return
        }
      }

      await updateTask.mutateAsync({
        input: updateTaskInputFromFormValues(values),
        projectId,
        taskId: editor.taskId,
      })
      toast.success('Task updated.')
      setEditor(null)
    }
  }

  const confirmEditCompletion = async () => {
    if (editCompletionState === null || editCompletionState.mode !== 'edit') {
      return
    }

    await updateTask.mutateAsync({
      input: updateTaskInputFromFormValues(editCompletionState.values),
      projectId,
      taskId: editCompletionState.task.id,
    })
    toast.success('Task updated.')
    setEditCompletionState(null)
    setEditor(null)
  }

  const toggleExpanded = (taskId: string) => {
    setExpandedTaskIds((currentTaskIds) =>
      currentTaskIds.includes(taskId)
        ? currentTaskIds.filter((currentTaskId) => currentTaskId !== taskId)
        : [...currentTaskIds, taskId],
    )
  }

  return (
    <section className="project-workspace__panel task-panel">
      <div className="member-workspace__section-header">
        <div>
          <p className="project-workspace__eyebrow">Project tasks</p>
          <h3 className="project-workspace__section-title">Tasks and subtasks</h3>
        </div>
        <button className="project-workspace__action" type="button" onClick={startCreate}>
          New task
        </button>
      </div>

      <TaskFilterToolbar
        members={members}
        filterAssigneeId={filterAssigneeId}
        onFilterAssigneeIdChange={setFilterAssigneeId}
        filterPriority={filterPriority}
        onFilterPriorityChange={setFilterPriority}
      />

      <FocusedFormDialog
        isOpen={editor !== null}
        title={editor?.mode === 'create' ? 'CREATE TASK' : 'EDIT TASK'}
        onClose={closeTaskStates}
        headerActions={
          <div className="focused-form-dialog__header-actions">
            <button
              className="project-form__button project-form__button--secondary"
              type="button"
              onClick={closeTaskStates}
              disabled={createTask.isPending || updateTask.isPending}
            >
              Cancel
            </button>
            <button
              className="project-form__button project-form__button--primary"
              type="submit"
              form="project-task-form"
              disabled={createTask.isPending || updateTask.isPending}
            >
              {createTask.isPending || updateTask.isPending ? 'Saving...' : (editor?.mode === 'create' ? 'Create task' : 'Save changes')}
            </button>
          </div>
        }
      >
        {editor !== null ? (
          <TaskForm
            cancelLabel="Cancel"
            description={editor.mode === 'create' ? 'Create a top-level project task.' : 'Update this task.'}
            initialValues={initialValues}
            isSubmitting={createTask.isPending || updateTask.isPending}
            members={members}
            submitLabel={editor.mode === 'create' ? 'Create task' : 'Save changes'}
            tags={tags}
            onCancel={closeTaskStates}
            onSubmit={saveTask}
            formId="project-task-form"
            showFooterActions={false}
          />
        ) : null}
      </FocusedFormDialog>

      {isLoading ? <div className="project-state">Loading tasks...</div> : null}
      {isError ? (
        <div className="project-state project-state--error">
          Unable to load tasks.
          <span>{error instanceof Error ? error.message : 'Unknown error'}</span>
        </div>
      ) : null}

      {!isLoading && !isError && tasks.length === 0 && editor === null ? (
        <div className="project-empty-state">
          <div>
            <p className="project-empty-state__eyebrow">No tasks yet</p>
            <h3 className="project-empty-state__title">Create the first project task</h3>
            <p className="project-empty-state__description">Track execution work inside this project.</p>
          </div>
        </div>
      ) : null}

      {!isLoading && !isError && tasks.length > 0 && visibleTasks.length === 0 && editor === null ? (
        <div className="project-empty-state">
          <div>
            <p className="project-empty-state__eyebrow">No results</p>
            <h3 className="project-empty-state__title">No tasks found matching your filters</h3>
            <p className="project-empty-state__description">Try clearing or adjusting your active filters.</p>
          </div>
        </div>
      ) : null}

      {visibleTasks.length > 0 ? (
        <div className="project-list task-panel__list">
          {visibleTasks.map((task) => (
            <TaskCard
              key={task.id}
              isEditing={editor?.mode === 'edit' && editor.taskId === task.id}
              isExpanded={expandedTaskIds.includes(task.id)}
              members={members}
              onCloseConflictingTaskStates={closeTaskStates}
              onDeleteTask={requestDelete}
              onEditTask={startEdit}
              onSuggestPriority={requestPrioritySuggestion}
              onToggleExpanded={toggleExpanded}
              projectId={projectId}
              tags={tags}
              task={task}
            />
          ))}
        </div>
      ) : null}

      <AIPrioritySuggestionDialog
        isOpen={prioritySuggestionTaskId !== null}
        onClose={() => setPrioritySuggestionTaskId(null)}
        projectId={projectId}
        taskId={prioritySuggestionTaskId ?? undefined}
      />

      <ConfirmDialog
        cancelLabel="Keep task"
        confirmLabel="Delete task"
        description="This removes the task and repository-managed subtasks under it."
        isOpen={deleteState !== null}
        isPending={deleteTask.isPending}
        onCancel={() => setDeleteState(null)}
        onConfirm={confirmDelete}
        pendingLabel="Deleting task..."
        title="Delete this task?"
      />

      <ConfirmDialog
        cancelLabel="Keep task open"
        confirmLabel="Save as done"
        description={`This task has ${
          activeTask === null ? 0 : getCompletionConfirmation(activeTask, activeTaskSubtasks).pendingSubtaskCount
        } pending subtasks. You can still save it as done after confirming.`}
        isOpen={editCompletionState !== null}
        isPending={updateTask.isPending}
        onCancel={() => setEditCompletionState(null)}
        onConfirm={confirmEditCompletion}
        pendingLabel="Saving task..."
        title="Save task as done with pending subtasks?"
      />
    </section>
  )
}
