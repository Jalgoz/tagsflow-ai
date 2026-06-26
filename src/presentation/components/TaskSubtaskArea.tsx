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
import { AISubtaskGeneratorDialog } from './AISubtaskGeneratorDialog'
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
  editorMode?: 'inline' | 'modal'
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

export const TaskSubtaskArea = ({ members, tags, task, editorMode = 'modal' }: TaskSubtaskAreaProps) => {
  const { data: subtasks = [], error, isError, isLoading } = useSubtasksByTask(task.id)
  const createSubtask = useCreateSubtask()
  const updateSubtask = useUpdateSubtask()
  const updateSubtaskStatus = useUpdateSubtaskStatus()
  const deleteSubtask = useDeleteSubtask()
  const toast = useToast()
  const [editor, setEditor] = useState<SubtaskEditorState>(null)
  const [deleteState, setDeleteState] = useState<SubtaskDeleteState | null>(null)
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)

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

  const isInlineEditor = editorMode === 'inline'
  const shouldShowList = !isInlineEditor || editor === null
  const editorTitle = editor?.mode === 'create' ? 'Create subtask' : 'Edit subtask'
  const editorDescription =
    editor?.mode === 'create'
      ? 'Create a subtask without leaving the task editor.'
      : 'Update this subtask without leaving the task editor.'

  const subtaskForm = editor !== null ? (
    <SubtaskForm
      description={isInlineEditor ? editorDescription : undefined}
      initialValues={initialValues}
      isSubmitting={createSubtask.isPending || updateSubtask.isPending}
      renderAsForm={isInlineEditor ? false : true}
      members={members}
      onCancel={closeSubtaskStates}
      onSubmit={saveSubtask}
      submitLabel={editor.mode === 'create' ? 'Create subtask' : 'Save changes'}
      tags={tags}
      title={isInlineEditor ? editorTitle : undefined}
      formId="subtask-form-id"
      showFooterActions={isInlineEditor}
    />
  ) : null

  const subtaskEditor = editor !== null ? (
    isInlineEditor ? (
      <div className="subtask-area__inline-editor">{subtaskForm}</div>
    ) : (
      <FocusedFormDialog
        isOpen={editor !== null}
        onClose={closeSubtaskStates}
        title={editor.mode === 'create' ? 'CREATE SUBTASK' : 'EDIT SUBTASK'}
        headerActions={
          <div className="focused-form-dialog__header-actions">
            <button
              className="project-form__button project-form__button--secondary"
              type="button"
              onClick={closeSubtaskStates}
              disabled={createSubtask.isPending || updateSubtask.isPending}
            >
              Cancel
            </button>
            <button
              className="project-form__button project-form__button--primary"
              type="submit"
              form="subtask-form-id"
              disabled={createSubtask.isPending || updateSubtask.isPending}
            >
              {createSubtask.isPending || updateSubtask.isPending ? 'Saving...' : editor.mode === 'create' ? 'Create subtask' : 'Save changes'}
            </button>
          </div>
        }
      >
        {subtaskForm}
      </FocusedFormDialog>
    )
  ) : null

  return (
    <div className="subtask-area">
      <div className="subtask-area__header">
        <h5>Subtasks</h5>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="project-list__button" style={{ whiteSpace: 'nowrap' }} type="button" onClick={() => setIsGeneratorOpen(true)}>
            Generate subtasks
          </button>
          <button className="project-list__button project-list__button--primary" style={{ whiteSpace: 'nowrap' }} type="button" onClick={startCreate}>
            New subtask
          </button>
        </div>
      </div>

      {subtaskEditor}

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

      {shouldShowList && visibleSubtasks.length > 0 ? (
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
                  <div className="task-actions__icon-row">
                    <button
                      aria-label="Edit"
                      className="project-list__button project-kanban__icon-button task-actions__icon-button"
                      type="button"
                      onClick={() => startEdit(subtask.id)}
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
                        <path
                          d="M4 20h4l10-10-4-4L4 16v4zm13.7-11.3l-2.4-2.4 1.4-1.4a1 1 0 011.4 0l1 1a1 1 0 010 1.4l-1.4 1.4z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                    <button
                      aria-label="Delete"
                      className="project-list__button project-list__button--danger project-kanban__icon-button task-actions__icon-button"
                      type="button"
                      onClick={() => requestDelete(subtask)}
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
                        <path
                          d="M7 21a2 2 0 01-2-2V7h14v12a2 2 0 01-2 2H7zm3-4h2V9h-2v8zm4 0h2V9h-2v8zM9 4h6l1 2h4v2H4V6h4l1-2z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  </div>
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
      <AISubtaskGeneratorDialog
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        projectId={task.projectId}
        taskId={task.id}
      />
    </div>
  )
}
