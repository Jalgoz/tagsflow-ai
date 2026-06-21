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
}

export const FocusedFormDialog = ({
  children,
  description,
  eyebrow = 'Focused edit',
  isOpen,
  onClose,
  title,
}: FocusedFormDialogProps) => {
  const titleId = useId()
  const descriptionId = useId()

  if (!isOpen || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div aria-hidden={false} className="focused-form-dialog__backdrop">
      <section
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="focused-form-dialog"
        role="dialog"
      >
        <div className="focused-form-dialog__header">
          <div>
            <p className="focused-form-dialog__eyebrow">{eyebrow}</p>
            <h2 className="focused-form-dialog__title" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className="focused-form-dialog__description" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          <button className="project-list__button project-list__button--secondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="focused-form-dialog__body">{children}</div>
      </section>
    </div>,
    document.body,
  )
}
