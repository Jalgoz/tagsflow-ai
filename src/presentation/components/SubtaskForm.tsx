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
  members: Member[]
  onCancel: () => void
  onSubmit: (values: SubtaskFormValues) => void | Promise<void>
  submitLabel: string
  tags: Tag[]
  title: string
}

export const SubtaskForm = ({
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
}: SubtaskFormProps) => {
  return (
    <TaskForm
      cancelLabel={cancelLabel}
      description={description}
      initialValues={initialValues ?? createEmptySubtaskFormValues()}
      isSubmitting={isSubmitting}
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
    />
  )
}
