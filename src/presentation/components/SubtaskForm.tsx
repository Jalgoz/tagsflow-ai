import {
  createEmptySubtaskFormValues,
  subtaskFormSchema,
  type SubtaskFormInput,
  type SubtaskFormValues,
} from '../../application'
import type { Member, Tag } from '../../domain'
import { TaskForm } from './TaskForm'

type SubtaskFormProps = {
  cancelLabel?: string
  description?: string
  initialValues?: SubtaskFormInput
  isSubmitting?: boolean
  renderAsForm?: boolean
  members: Member[]
  onCancel: () => void
  onSubmit: (values: SubtaskFormValues) => void | Promise<void>
  submitLabel: string
  tags: Tag[]
  title?: string
  formId?: string
  showFooterActions?: boolean
}

export const SubtaskForm = ({
  cancelLabel = 'Cancel',
  description,
  initialValues,
  isSubmitting = false,
  renderAsForm = true,
  members,
  onCancel,
  onSubmit,
  submitLabel,
  tags,
  title,
  formId = 'subtask-form',
  showFooterActions = true,
}: SubtaskFormProps) => {
  return (
    <TaskForm
      cancelLabel={cancelLabel}
      description={description}
      initialValues={initialValues ?? createEmptySubtaskFormValues()}
      isSubmitting={isSubmitting}
      renderAsForm={renderAsForm}
      members={members}
      onCancel={onCancel}
      onSubmit={async (values) => {
        const validationResult = subtaskFormSchema.safeParse(values)

        if (validationResult.success) {
          await onSubmit(validationResult.data)
        }
      }}
      submitLabel={submitLabel}
      tags={tags}
      title={title}
      formId={formId}
      showFooterActions={showFooterActions}
    />
  )
}
