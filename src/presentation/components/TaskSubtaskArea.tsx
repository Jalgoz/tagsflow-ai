import { useState } from 'react'
import {
  createEmptySubtaskFormValues,
  createSubtaskInputFromFormValues,
  subtaskToFormValues,
  updateSubtaskInputFromFormValues,
  useCreateSubtask,
  useDeleteSubtask,
  useSubtasksByTask,
  useUpdateSubtask,
  useUpdateSubtaskStatus,
  type SubtaskFormValues,
} from '../../application'
import type { Member, Subtask, Tag, Task, TaskStatus } from '../../domain'
import { ConfirmDialog, FocusedFormDialog, useToast } from '../feedback'
import { SubtaskForm } from './SubtaskForm'
import { TagBadge } from './TagBadge'

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

type TaskSubtaskAreaProps = {
  members: Member[]
  tags: Tag[]
  task: Task
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

export const TaskSubtaskArea = ({ members, tags, task }: TaskSubtaskAreaProps) => {
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
            initialValues={initialValues}
            isSubmitting={createSubtask.isPending || updateSubtask.isPending}
            members={members}
            onCancel={closeSubtaskStates}
            onSubmit={saveSubtask}
            submitLabel={editor.mode === 'create' ? 'Create subtask' : 'Save changes'}
            tags={tags}
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
