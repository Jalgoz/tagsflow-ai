import { useEffect, useState, type ReactNode } from 'react'
import type { Member, Subtask, Tag, Task } from '../../domain'
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '../../shared/constants'
import { FocusedFormDialog } from '../feedback'
import { TagBadge } from './TagBadge'
import type { TaskDetailMetadata } from './project-kanban-helpers'

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

const formatDate = (value: string | null): string => (value === null || value.trim() === '' ? 'Not set' : value)

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

const SubtaskDetailCard = ({
  members,
  subtask,
  tags,
}: {
  members: Member[]
  subtask: Subtask
  tags: Tag[]
}) => {
  const visibleTags = findTaskTags(tags, subtask.tagIds)

  return (
    <article className="project-kanban__subtask-card">
      <div className="project-kanban__subtask-card-header">
        <div>
          <h4 className="project-kanban__subtask-card-title">{subtask.title}</h4>
          <p className="project-kanban__subtask-card-description">{subtask.description || 'No description provided.'}</p>
        </div>
        <span className={`project-status project-status--${subtask.status}`}>{TASK_STATUS_LABELS[subtask.status]}</span>
      </div>

      <dl className="project-list__details project-kanban__subtask-grid">
        <DetailField label="Priority" value={TASK_PRIORITY_LABELS[subtask.priority]} />
        <DetailField label="Due date" value={formatDate(subtask.dueDate)} />
        <DetailField label="Assignee" value={findMemberName(members, subtask.assigneeMemberId)} />
        <DetailField label="Checklist" value={checklistSummary(subtask.checklist)} />
      </dl>

      <div className="project-kanban__subtask-tags">
        {visibleTags.length === 0 ? <p className="task-form__muted">No tags.</p> : null}
        {visibleTags.map((tag) => (
          <TagBadge key={tag.id} tag={tag} />
        ))}
      </div>
    </article>
  )
}

export type TaskDetailReadonlyDialogProps = {
  activeTask: Task | null
  detailMetadata: TaskDetailMetadata | null
  activeTaskSubtasks: Subtask[]
  isOpen: boolean
  onClose: () => void
  members: Member[]
  tags: Tag[]
  headerActions?: ReactNode
}

export const TaskDetailReadonlyDialog = ({
  activeTask,
  detailMetadata,
  activeTaskSubtasks,
  isOpen,
  onClose,
  members,
  tags,
  headerActions,
}: TaskDetailReadonlyDialogProps) => {
  const [isSubtaskDetailsOpen, setIsSubtaskDetailsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setIsSubtaskDetailsOpen(false)
    }
  }, [isOpen])

  return (
    <FocusedFormDialog
      eyebrow="Task detail"
      description="Review task information without leaving the Kanban."
      isOpen={isOpen && activeTask !== null}
      onClose={onClose}
      title={activeTask?.title ?? 'Task details'}
      headerActions={headerActions}
    >
      {isOpen && activeTask !== null && detailMetadata !== null ? (
        <div className="project-kanban__detail">
          <div className="project-kanban__detail-header">
            <div className="project-kanban__detail-summary">
              <span className={`project-status project-status--${activeTask.status}`}>{detailMetadata.status}</span>
              <span className={`task-priority task-priority--${activeTask.priority}`}>{detailMetadata.priority}</span>
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
              {activeTaskSubtasks.length > 0 ? (
                <div className="project-kanban__subtasks-toggle-row">
                  <button
                    className="project-list__button"
                    type="button"
                    onClick={() => setIsSubtaskDetailsOpen((current) => !current)}
                  >
                    {isSubtaskDetailsOpen ? 'Hide subtasks' : 'Show subtasks'}
                  </button>
                </div>
              ) : null}

              <div
                aria-hidden={!isSubtaskDetailsOpen}
                className={`project-kanban__subtask-list${isSubtaskDetailsOpen ? ' project-kanban__subtask-list--open' : ''}`}
              >
                {activeTaskSubtasks.map((subtask) => (
                  <SubtaskDetailCard key={subtask.id} members={members} subtask={subtask} tags={tags} />
                ))}
              </div>
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
  )
}
