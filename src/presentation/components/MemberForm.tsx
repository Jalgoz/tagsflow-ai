import { useEffect } from 'react'
import { useForm, type Path } from 'react-hook-form'
import {
  createEmptyMemberFormValues,
  memberFormSchema,
  type MemberFormInput,
  type MemberFormValues,
} from '../../application'

type MemberFormProps = {
  cancelLabel?: string
  description?: string
  initialValues?: MemberFormInput
  isSubmitting?: boolean
  onCancel: () => void
  onSubmit: (values: MemberFormValues) => void | Promise<void>
  submitLabel: string
  title: string
}

const fieldErrorKey = (path: Path<MemberFormInput>): Path<MemberFormInput> => path

export const MemberForm = ({
  cancelLabel = 'Cancel',
  description,
  initialValues,
  isSubmitting = false,
  onCancel,
  onSubmit,
  submitLabel,
  title,
}: MemberFormProps) => {
  const form = useForm<MemberFormInput>({
    defaultValues: initialValues ?? createEmptyMemberFormValues(),
    mode: 'onSubmit',
  })

  useEffect(() => {
    form.reset(initialValues ?? createEmptyMemberFormValues())
  }, [form, initialValues])

  const submitHandler = form.handleSubmit(async (values) => {
    const validationResult = memberFormSchema.safeParse(values)

    if (!validationResult.success) {
      form.clearErrors()

      validationResult.error.issues.forEach((issue) => {
        const key = issue.path[0]

        if (typeof key === 'string' && key in values) {
          form.setError(fieldErrorKey(key as Path<MemberFormInput>), {
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
    <form className="project-form member-form" onSubmit={submitHandler}>
      <div className="project-form__header">
        <div>
          <h3 className="project-form__title">{title}</h3>
          {description ? <p className="project-form__description">{description}</p> : null}
        </div>
        <span className="project-form__badge">Member</span>
      </div>

      <div className="project-form__grid">
        <label className="project-form__field project-form__field--wide">
          <span className="project-form__label">Name *</span>
          <input
            {...form.register('name')}
            className="project-form__input"
            placeholder="Add a member name"
            type="text"
          />
          {form.formState.errors.name ? <span className="project-form__error">{form.formState.errors.name.message}</span> : null}
        </label>

        <label className="project-form__field">
          <span className="project-form__label">Email</span>
          <input
            {...form.register('email')}
            className="project-form__input"
            placeholder="member@example.com"
            type="email"
          />
          {form.formState.errors.email ? <span className="project-form__error">{form.formState.errors.email.message}</span> : null}
        </label>

        <label className="project-form__field">
          <span className="project-form__label">Role</span>
          <input
            {...form.register('role')}
            className="project-form__input"
            placeholder="Engineer"
            type="text"
          />
          {form.formState.errors.role ? <span className="project-form__error">{form.formState.errors.role.message}</span> : null}
        </label>

        <label className="project-form__field project-form__field--wide">
          <span className="project-form__label">Avatar</span>
          <input
            {...form.register('avatar')}
            className="project-form__input"
            placeholder="AL"
            type="text"
          />
          {form.formState.errors.avatar ? <span className="project-form__error">{form.formState.errors.avatar.message}</span> : null}
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
