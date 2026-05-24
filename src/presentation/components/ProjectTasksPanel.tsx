import { useMemo, useState } from 'react'
import {
  createEmptySubtaskFormValues,
  createEmptyTaskFormValues,
  createSubtaskInputFromFormValues,
  createTaskInputFromFormValues,
  subtaskToFormValues,
  taskToFormValues,
  updateSubtaskInputFromFormValues,
  updateTaskInputFromFormValues,
  useCreateSubtask,
  useCreateTask,
  useDeleteSubtask,
  useDeleteTask,
  useMembers,
  useSubtasksByTask,
  useTags,
  useTasksByProject,
  useUpdateSubtask,
  useUpdateSubtaskStatus,
  useUpdateTask,
  useUpdateTaskStatus,
  type SubtaskFormValues,
  type TaskFormValues,
} from '../../application'
import type { Member, Subtask, Tag, Task, TaskStatus } from '../../domain'
import { requiresTaskCompletionConfirmation } from '../../domain'
import { ConfirmDialog, FocusedFormDialog, useToast } from '../feedback'
import { SubtaskForm } from './SubtaskForm'
import { TagBadge } from './TagBadge'
import { TaskForm } from './TaskForm'

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

type SubtaskEditorState =
  | {
      mode: 'create'
    }
  | {
      mode: 'edit'
      subtaskId: string
    }
  | null

type SubtaskDeleteState = {
  subtask: Subtask
}

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
        <button className="project-list__button" type="button" onClick={() => onToggleExpanded(task.id)}>
          {isExpanded ? 'Hide subtasks' : 'Show subtasks'}
        </button>
        <button className="project-list__button" type="button" onClick={() => onEditTask(task.id)}>
          Edit
        </button>
        <button className="project-list__button project-list__button--danger" type="button" onClick={() => onDeleteTask(task)}>
          Delete
        </button>
      </div>

      {isExpanded ? <SubtaskArea members={members} tags={tags} task={task} /> : null}

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

type SubtaskAreaProps = {
  members: Member[]
  tags: Tag[]
  task: Task
}

const SubtaskArea = ({ members, tags, task }: SubtaskAreaProps) => {
  const { data: subtasks = [], error, isError, isLoading } = useSubtasksByTask(task.id)
  const createSubtask = useCreateSubtask()
  const updateSubtask = useUpdateSubtask()
  const updateSubtaskStatus = useUpdateSubtaskStatus()
  const deleteSubtask = useDeleteSubtask()
  const toast = useToast()
  const [editor, setEditor] = useState<SubtaskEditorState>(null)
  const [deleteState, setDeleteState] = useState<SubtaskDeleteState | null>(null)

  const activeSubtask =
    editor?.mode === 'edit' ? subtasks.find((subtask) => subtask.id === editor.subtaskId) ?? null : null
  const visibleSubtasks =
    editor?.mode === 'edit' && activeSubtask !== null
      ? subtasks.filter((subtask) => subtask.id !== activeSubtask.id)
      : subtasks
  const initialValues =
    editor?.mode === 'edit' && activeSubtask !== null ? subtaskToFormValues(activeSubtask) : createEmptySubtaskFormValues()

  const closeSubtaskStates = () => {
    setEditor(null)
    setDeleteState(null)
  }

  const startCreate = () => {
    setDeleteState(null)
    setEditor({ mode: 'create' })
  }

  const startEdit = (subtaskId: string) => {
    setDeleteState(null)
    setEditor({ mode: 'edit', subtaskId })
  }

  const requestDelete = (subtask: Subtask) => {
    setEditor(null)
    setDeleteState({ subtask })
  }

  const confirmDelete = async () => {
    if (deleteState === null) {
      return
    }

    await deleteSubtask.mutateAsync({ subtaskId: deleteState.subtask.id, taskId: task.id })
    toast.success('Subtask deleted.')
    setDeleteState(null)
  }

  const saveSubtask = async (values: SubtaskFormValues) => {
    if (editor?.mode === 'create') {
      await createSubtask.mutateAsync(createSubtaskInputFromFormValues(task.id, values))
      toast.success('Subtask created.')
      setEditor(null)
      return
    }

    if (editor?.mode === 'edit') {
      await updateSubtask.mutateAsync({
        input: updateSubtaskInputFromFormValues(values),
        subtaskId: editor.subtaskId,
        taskId: task.id,
      })
      toast.success('Subtask updated.')
      setEditor(null)
    }
  }

  const updateStatus = async (subtask: Subtask, status: TaskStatus) => {
    if (subtask.status === status) {
      return
    }

    await updateSubtaskStatus.mutateAsync({ status, subtaskId: subtask.id, taskId: task.id })
    toast.success('Subtask status updated.')
  }

  return (
    <div className="subtask-area">
      <div className="subtask-area__header">
        <h5>Subtasks</h5>
        <button className="project-list__button" type="button" onClick={startCreate}>
          New subtask
        </button>
      </div>

      <FocusedFormDialog
        description={`Subtasks stay attached to ${task.title}.`}
        isOpen={editor !== null}
        onClose={closeSubtaskStates}
        title={editor?.mode === 'create' ? 'Create subtask' : 'Edit subtask'}
      >
        {editor !== null ? (
          <SubtaskForm
            description={
              editor.mode === 'create'
                ? `Create a one-level subtask for ${task.title}.`
                : `Update this subtask for ${task.title}.`
            }
            initialValues={initialValues}
            isSubmitting={createSubtask.isPending || updateSubtask.isPending}
            members={members}
            onCancel={closeSubtaskStates}
            onSubmit={saveSubtask}
            submitLabel={editor.mode === 'create' ? 'Create subtask' : 'Save changes'}
            tags={tags}
            title={editor.mode === 'create' ? 'Create subtask' : 'Edit subtask'}
          />
        ) : null}
      </FocusedFormDialog>

      {isLoading ? <div className="project-state">Loading subtasks...</div> : null}
      {isError ? (
        <div className="project-state project-state--error">
          Unable to load subtasks.
          <span>{error instanceof Error ? error.message : 'Unknown error'}</span>
        </div>
      ) : null}
      {!isLoading && !isError && subtasks.length === 0 && editor === null ? (
        <p className="subtask-area__empty">No subtasks yet.</p>
      ) : null}

      {visibleSubtasks.length > 0 ? (
        <div className="subtask-area__list">
          {visibleSubtasks.map((subtask) => {
            const visibleTags = findTaskTags(tags, subtask.tagIds)

            return (
              <article key={subtask.id} className="subtask-card">
                <div>
                  <div className="subtask-card__title-row">
                    <h6>{subtask.title}</h6>
                    <span className={`project-status project-status--${subtask.status}`}>{formatStatus(subtask.status)}</span>
                  </div>
                  <p>{subtask.description || 'No description provided.'}</p>
                  <dl className="project-list__details task-card__details">
                    <div>
                      <dt>Priority</dt>
                      <dd>{subtask.priority}</dd>
                    </div>
                    <div>
                      <dt>Due</dt>
                      <dd>{formatDate(subtask.dueDate)}</dd>
                    </div>
                    <div>
                      <dt>Assignee</dt>
                      <dd>{findMemberName(members, subtask.assigneeMemberId)}</dd>
                    </div>
                    <div>
                      <dt>Checklist</dt>
                      <dd>{checklistSummary(subtask.checklist)}</dd>
                    </div>
                  </dl>
                  <div className="task-card__tags">
                    {visibleTags.map((tag) => (
                      <TagBadge key={tag.id} tag={tag} />
                    ))}
                  </div>
                </div>
                <div className="project-list__actions subtask-card__actions">
                  <select
                    aria-label={`Update status for ${subtask.title}`}
                    className="project-form__input task-card__status-select"
                    value={subtask.status}
                    onChange={(event) => void updateStatus(subtask, event.target.value as TaskStatus)}
                  >
                    <option value="backlog">Backlog</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                  <button className="project-list__button" type="button" onClick={() => startEdit(subtask.id)}>
                    Edit
                  </button>
                  <button className="project-list__button project-list__button--danger" type="button" onClick={() => requestDelete(subtask)}>
                    Delete
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      ) : null}

      <ConfirmDialog
        cancelLabel="Keep subtask"
        confirmLabel="Delete subtask"
        description="This removes the subtask from its parent task."
        isOpen={deleteState !== null}
        isPending={deleteSubtask.isPending}
        onCancel={() => setDeleteState(null)}
        onConfirm={confirmDelete}
        pendingLabel="Deleting subtask..."
        title="Delete this subtask?"
      />
    </div>
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

  const activeTask = editor?.mode === 'edit' ? tasks.find((task) => task.id === editor.taskId) ?? null : null
  const { data: activeTaskSubtasks = [] } = useSubtasksByTask(activeTask?.id)
  const visibleTasks =
    editor?.mode === 'edit' && activeTask !== null ? tasks.filter((task) => task.id !== activeTask.id) : tasks
  const initialValues = useMemo(
    () => (editor?.mode === 'edit' && activeTask !== null ? taskToFormValues(activeTask) : createEmptyTaskFormValues()),
    [activeTask, editor?.mode],
  )

  const closeTaskStates = () => {
    setEditor(null)
    setDeleteState(null)
    setEditCompletionState(null)
  }

  const startCreate = () => {
    setDeleteState(null)
    setEditor({ mode: 'create' })
  }

  const startEdit = (taskId: string) => {
    setDeleteState(null)
    setEditor({ mode: 'edit', taskId })
  }

  const requestDelete = (task: Task) => {
    setEditor(null)
    setDeleteState({ task })
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

      {editor !== null ? (
        <div className="project-workspace__panel member-workspace__inline-panel">
          <TaskForm
            description={editor.mode === 'create' ? 'Create a top-level project task.' : 'Update this task.'}
            initialValues={initialValues}
            isSubmitting={createTask.isPending || updateTask.isPending}
            members={members}
            onCancel={closeTaskStates}
            onSubmit={saveTask}
            submitLabel={editor.mode === 'create' ? 'Create task' : 'Save changes'}
            tags={tags}
            title={editor.mode === 'create' ? 'Create task' : 'Edit task'}
          />
        </div>
      ) : null}

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
              onToggleExpanded={toggleExpanded}
              projectId={projectId}
              tags={tags}
              task={task}
            />
          ))}
        </div>
      ) : null}

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
