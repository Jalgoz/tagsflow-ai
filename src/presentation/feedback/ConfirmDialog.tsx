import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'

type ConfirmDialogProps = {
  isOpen: boolean
  title: string
  description: string
  cancelLabel?: string
  confirmLabel?: string
  pendingLabel?: string
  isPending?: boolean
  isDisabled?: boolean
  onCancel: () => void
  onConfirm: () => void | Promise<void>
}

export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  pendingLabel = 'Working...',
  isPending = false,
  isDisabled = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) => {
  const titleId = useId()
  const descriptionId = useId()
  const isInteractionDisabled = isPending || isDisabled

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || isInteractionDisabled) {
        return
      }

      event.preventDefault()
      onCancel()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isInteractionDisabled, isOpen, onCancel])

  if (!isOpen || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      aria-hidden={false}
      className="confirm-dialog__backdrop"
      onClick={() => {
        if (isInteractionDisabled) {
          return
        }

        onCancel()
      }}
    >
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="confirm-dialog"
        role="alertdialog"
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <div className="confirm-dialog__content">
          <p className="confirm-dialog__eyebrow">Destructive action</p>
          <h2 className="confirm-dialog__title" id={titleId}>
            {title}
          </h2>
          <p className="confirm-dialog__description" id={descriptionId}>
            {description}
          </p>
        </div>

        <div className="confirm-dialog__actions">
          <button
            className="project-list__button project-list__button--secondary"
            disabled={isInteractionDisabled}
            type="button"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className="project-list__button project-list__button--danger"
            disabled={isInteractionDisabled}
            type="button"
            onClick={() => {
              void onConfirm()
            }}
          >
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
