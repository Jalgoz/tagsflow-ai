import { useId } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

type FocusedFormDialogProps = {
  eyebrow?: string
  children: ReactNode
  description?: string
  isOpen: boolean
  onClose: () => void
  title: string
  headerActions?: ReactNode
}

export const FocusedFormDialog = ({
  children,
  description,
  eyebrow,
  isOpen,
  onClose,
  title,
  headerActions,
}: FocusedFormDialogProps) => {
  const titleId = useId()
  const descriptionId = useId()

  if (!isOpen || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      aria-hidden={false}
      className="focused-form-dialog__backdrop"
      onClick={onClose}
    >
      <section
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="focused-form-dialog"
        role="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Close dialog"
          className="focused-form-dialog__close"
          type="button"
          onClick={onClose}
        >
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
          </svg>
        </button>
        <div className="focused-form-dialog__header">
          <div>
            {eyebrow ? <p className="focused-form-dialog__eyebrow">{eyebrow}</p> : null}
            <h2 className="focused-form-dialog__title" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className="focused-form-dialog__description" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          {headerActions ? (
            <div className="focused-form-dialog__header-actions">{headerActions}</div>
          ) : null}
        </div>
        <div className="focused-form-dialog__body">{children}</div>
      </section>
    </div>,
    document.body,
  )
}
