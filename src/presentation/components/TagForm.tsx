import { useEffect } from 'react'
import { useForm, useWatch, type Path } from 'react-hook-form'
import { createEmptyTagFormValues, tagFormSchema, type TagFormInput, type TagFormValues } from '../../application'

const TAG_COLOR_SWATCHES = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
const isHexColor = (value: string): boolean => /^#[0-9a-fA-F]{6}$/.test(value)

type TagFormProps = {
  cancelLabel?: string
  description?: string
  initialValues?: TagFormInput
  isSubmitting?: boolean
  onCancel: () => void
  onSubmit: (values: TagFormValues) => void | Promise<void>
  submitLabel: string
  title: string
}

const fieldErrorKey = (path: Path<TagFormInput>): Path<TagFormInput> => path

export const TagForm = ({
  cancelLabel = 'Cancel',
  description,
  initialValues,
  isSubmitting = false,
  onCancel,
  onSubmit,
  submitLabel,
  title,
}: TagFormProps) => {
  const form = useForm<TagFormInput>({
    defaultValues: initialValues ?? createEmptyTagFormValues(),
    mode: 'onSubmit',
  })
  const currentColor = useWatch({ control: form.control, name: 'color' }) ?? ''
  const colorPickerValue = isHexColor(currentColor) ? currentColor : '#6366f1'

  useEffect(() => {
    form.reset(initialValues ?? createEmptyTagFormValues())
  }, [form, initialValues])

  const submitHandler = form.handleSubmit(async (values) => {
    const validationResult = tagFormSchema.safeParse(values)

    if (!validationResult.success) {
      form.clearErrors()

      validationResult.error.issues.forEach((issue) => {
        const key = issue.path[0]

        if (typeof key === 'string' && key in values) {
          form.setError(fieldErrorKey(key as Path<TagFormInput>), {
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
    <form className="project-form tag-form" onSubmit={submitHandler}>
      <div className="project-form__header">
        <div>
          <h3 className="project-form__title">{title}</h3>
          {description ? <p className="project-form__description">{description}</p> : null}
        </div>
        <span className="project-form__badge">Tag</span>
      </div>

      <div className="project-form__grid">
        <label className="project-form__field project-form__field--wide">
          <span className="project-form__label">Name *</span>
          <input
            {...form.register('name')}
            className="project-form__input"
            placeholder="Add a tag name"
            type="text"
          />
          {form.formState.errors.name ? <span className="project-form__error">{form.formState.errors.name.message}</span> : null}
        </label>

        <label className="project-form__field project-form__field--wide">
          <span className="project-form__label">Color</span>
          <div className="tag-form__color-control">
            <input
              aria-label="Pick tag color"
              className="tag-form__color-picker"
              type="color"
              value={colorPickerValue}
              onChange={(event) => {
                form.setValue('color', event.target.value, { shouldDirty: true })
              }}
            />
            <input
              {...form.register('color')}
              className="project-form__input tag-form__color-input"
              placeholder="#6366f1"
              type="text"
            />
          </div>
          <div className="tag-form__swatches" aria-label="Tag color presets">
            {TAG_COLOR_SWATCHES.map((color) => (
              <button
                key={color}
                aria-label={`Use ${color}`}
                className="tag-form__swatch"
                style={{ backgroundColor: color }}
                type="button"
                onClick={() => {
                  form.setValue('color', color, { shouldDirty: true })
                }}
              />
            ))}
          </div>
          {form.formState.errors.color ? <span className="project-form__error">{form.formState.errors.color.message}</span> : null}
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
