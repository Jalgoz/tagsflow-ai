import { useEffect } from 'react'
import { useForm, useWatch, type Path } from 'react-hook-form'
import {
  createEmptyTaskFormValues,
  taskFormSchema,
  type ChecklistFormItemValues,
  type TaskFormInput,
  type TaskFormValues,
} from '../../application'
import type { Member, Tag } from '../../domain'
import { ChecklistEditor } from './ChecklistEditor'
import { TagBadge } from './TagBadge'

type TaskFormProps = {
  cancelLabel?: string
  description?: string
  initialValues?: TaskFormInput
  isSubmitting?: boolean
  members: Member[]
  onCancel: () => void
  onSubmit: (values: TaskFormValues) => void | Promise<void>
  submitLabel: string
  tags: Tag[]
  title: string
}

const fieldErrorKey = (path: Path<TaskFormInput>): Path<TaskFormInput> => path

export const TaskForm = ({
  cancelLabel = 'Cancel',
  description,
  initialValues,
  isSubmitting = false,
  members,
  onCancel,
  onSubmit,
  submitLabel,
  tags,
  title,
}: TaskFormProps) => {
  const form = useForm<TaskFormInput>({
    defaultValues: initialValues ?? createEmptyTaskFormValues(),
    mode: 'onSubmit',
  })
  const selectedTagIds = useWatch({ control: form.control, name: 'tagIds' })
  const checklist = useWatch({ control: form.control, name: 'checklist' })

  useEffect(() => {
    form.reset(initialValues ?? createEmptyTaskFormValues())
  }, [form, initialValues])

  const setValidationErrors = (values: TaskFormInput, issues: Array<{ path: PropertyKey[]; message: string }>) => {
    form.clearErrors()

    issues.forEach((issue) => {
      const key = issue.path[0]

      if (typeof key === 'string' && key in values) {
        form.setError(fieldErrorKey(key as Path<TaskFormInput>), {
          message: issue.message,
          type: 'validation',
        })
      }
    })
  }

  const submitHandler = form.handleSubmit(async (values) => {
    const validationResult = taskFormSchema.safeParse(values)

    if (!validationResult.success) {
      setValidationErrors(values, validationResult.error.issues)
      return
    }

    await onSubmit(validationResult.data)
  })

  const toggleTag = (tagId: string) => {
    const nextTagIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((currentTagId) => currentTagId !== tagId)
      : [...selectedTagIds, tagId]

    form.setValue('tagIds', nextTagIds, { shouldDirty: true })
  }

  const setChecklist = (items: ChecklistFormItemValues[]) => {
    form.setValue('checklist', items, { shouldDirty: true })
  }

  return (
    <form className="project-form task-form" onSubmit={submitHandler}>
      <div className="project-form__header">
        <div>
          <h3 className="project-form__title">{title}</h3>
          {description ? <p className="project-form__description">{description}</p> : null}
        </div>
        <span className="project-form__badge">Task</span>
      </div>

      <div className="project-form__grid">
        <label className="project-form__field project-form__field--wide">
          <span className="project-form__label">Title *</span>
          <input {...form.register('title')} className="project-form__input" placeholder="Add a task title" type="text" />
          {form.formState.errors.title ? <span className="project-form__error">{form.formState.errors.title.message}</span> : null}
        </label>

        <label className="project-form__field">
          <span className="project-form__label">Status *</span>
          <select {...form.register('status')} className="project-form__input">
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          {form.formState.errors.status ? <span className="project-form__error">{form.formState.errors.status.message}</span> : null}
        </label>

        <label className="project-form__field">
          <span className="project-form__label">Priority *</span>
          <select {...form.register('priority')} className="project-form__input">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          {form.formState.errors.priority ? <span className="project-form__error">{form.formState.errors.priority.message}</span> : null}
        </label>

        <label className="project-form__field">
          <span className="project-form__label">Start date</span>
          <input {...form.register('startDate')} className="project-form__input" type="date" />
          {form.formState.errors.startDate ? <span className="project-form__error">{form.formState.errors.startDate.message}</span> : null}
        </label>

        <label className="project-form__field">
          <span className="project-form__label">Due date</span>
          <input {...form.register('dueDate')} className="project-form__input" type="date" />
          {form.formState.errors.dueDate ? <span className="project-form__error">{form.formState.errors.dueDate.message}</span> : null}
        </label>

        <label className="project-form__field">
          <span className="project-form__label">Assignee</span>
          <select {...form.register('assigneeMemberId')} className="project-form__input">
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>

        <label className="project-form__field project-form__field--wide">
          <span className="project-form__label">Description</span>
          <textarea {...form.register('description')} className="project-form__input project-form__textarea" rows={3} />
        </label>

        <label className="project-form__field project-form__field--wide">
          <span className="project-form__label">In-scope content</span>
          <textarea {...form.register('inScopeContent')} className="project-form__input project-form__textarea" rows={3} />
        </label>

        <label className="project-form__field project-form__field--wide">
          <span className="project-form__label">Out-of-scope content</span>
          <textarea {...form.register('outOfScopeContent')} className="project-form__input project-form__textarea" rows={3} />
        </label>

        <div className="project-form__field project-form__field--wide">
          <span className="project-form__label">Tags</span>
          <div className="task-form__tag-options">
            {tags.length === 0 ? <span className="task-form__muted">No tags available.</span> : null}
            {tags.map((tag) => (
              <label key={tag.id} className="task-form__tag-option">
                <input checked={selectedTagIds.includes(tag.id)} type="checkbox" onChange={() => toggleTag(tag.id)} />
                <TagBadge tag={tag} />
              </label>
            ))}
          </div>
        </div>

        <div className="project-form__field project-form__field--wide">
          <span className="project-form__label">Checklist</span>
          <ChecklistEditor items={checklist} onChange={setChecklist} />
          {form.formState.errors.checklist ? <span className="project-form__error">Checklist items must include text.</span> : null}
        </div>
      </div>

      <div className="project-form__actions">
        <button className="project-form__button project-form__button--secondary" type="button" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button className="project-form__button project-form__button--primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
