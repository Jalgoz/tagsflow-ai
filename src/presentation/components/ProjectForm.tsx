import { useEffect } from 'react'
import { useForm, type Path } from 'react-hook-form'
import {
  createEmptyProjectFormValues,
  projectFormSchema,
  type ProjectFormInput,
  type ProjectFormValues,
} from '../../application'

type ProjectFormProps = {
  cancelLabel?: string
  description?: string
  initialValues?: ProjectFormInput
  isSubmitting?: boolean
  onCancel: () => void
  onSubmit: (values: ProjectFormValues) => void | Promise<void>
  submitLabel: string
  title: string
}

const fieldErrorKey = (path: Path<ProjectFormInput>): Path<ProjectFormInput> => path

export const ProjectForm = ({
  cancelLabel = 'Cancel',
  description,
  initialValues,
  isSubmitting = false,
  onCancel,
  onSubmit,
  submitLabel,
  title,
}: ProjectFormProps) => {
  const form = useForm<ProjectFormInput>({
    defaultValues: initialValues ?? createEmptyProjectFormValues(),
    mode: 'onSubmit',
  })

  useEffect(() => {
    form.reset(initialValues ?? createEmptyProjectFormValues())
  }, [form, initialValues])

  const submitHandler = form.handleSubmit(async (values) => {
    const validationResult = projectFormSchema.safeParse(values)

    if (!validationResult.success) {
      form.clearErrors()

      validationResult.error.issues.forEach((issue) => {
        const key = issue.path[0]

        if (typeof key === 'string' && key in values) {
          form.setError(fieldErrorKey(key as Path<ProjectFormInput>), {
            message: issue.message,
            type: 'validation',
          })
        }
      })

      return
    }

    await onSubmit(validationResult.data)
  })

  return (
    <form className="project-form" onSubmit={submitHandler}>
      <div className="project-form__header">
        <div>
          <h3 className="project-form__title">{title}</h3>
          {description ? <p className="project-form__description">{description}</p> : null}
        </div>
        <span className="project-form__badge">Project</span>
      </div>

      <div className="project-form__grid">
        <label className="project-form__field project-form__field--wide">
          <span className="project-form__label">Title *</span>
          <input
            {...form.register('title')}
            className="project-form__input"
            placeholder="Add a project title"
            type="text"
          />
          {form.formState.errors.title ? (
            <span className="project-form__error">{form.formState.errors.title.message}</span>
          ) : null}
        </label>

        <label className="project-form__field">
          <span className="project-form__label">Status</span>
          <select {...form.register('status')} className="project-form__input">
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
          {form.formState.errors.status ? (
            <span className="project-form__error">{form.formState.errors.status.message}</span>
          ) : null}
        </label>

        <label className="project-form__field">
          <span className="project-form__label">Start date</span>
          <input {...form.register('startDate')} className="project-form__input" type="date" />
          {form.formState.errors.startDate ? (
            <span className="project-form__error">{form.formState.errors.startDate.message}</span>
          ) : null}
        </label>

        <label className="project-form__field">
          <span className="project-form__label">Due date</span>
          <input {...form.register('dueDate')} className="project-form__input" type="date" />
          {form.formState.errors.dueDate ? (
            <span className="project-form__error">{form.formState.errors.dueDate.message}</span>
          ) : null}
        </label>

        <label className="project-form__field project-form__field--wide">
          <span className="project-form__label">Description</span>
          <textarea
            {...form.register('description')}
            className="project-form__input project-form__textarea"
            placeholder="Describe the project"
            rows={3}
          />
          {form.formState.errors.description ? (
            <span className="project-form__error">{form.formState.errors.description.message}</span>
          ) : null}
        </label>

        <label className="project-form__field project-form__field--wide">
          <span className="project-form__label">Objective</span>
          <textarea
            {...form.register('objective')}
            className="project-form__input project-form__textarea"
            placeholder="State the project objective"
            rows={3}
          />
          {form.formState.errors.objective ? (
            <span className="project-form__error">{form.formState.errors.objective.message}</span>
          ) : null}
        </label>

        <label className="project-form__field project-form__field--wide">
          <span className="project-form__label">In-scope content</span>
          <textarea
            {...form.register('inScopeContent')}
            className="project-form__input project-form__textarea"
            placeholder="Describe what is included"
            rows={3}
          />
          {form.formState.errors.inScopeContent ? (
            <span className="project-form__error">{form.formState.errors.inScopeContent.message}</span>
          ) : null}
        </label>

        <label className="project-form__field project-form__field--wide">
          <span className="project-form__label">Out-of-scope content</span>
          <textarea
            {...form.register('outOfScopeContent')}
            className="project-form__input project-form__textarea"
            placeholder="Describe what is excluded"
            rows={3}
          />
          {form.formState.errors.outOfScopeContent ? (
            <span className="project-form__error">{form.formState.errors.outOfScopeContent.message}</span>
          ) : null}
        </label>
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
