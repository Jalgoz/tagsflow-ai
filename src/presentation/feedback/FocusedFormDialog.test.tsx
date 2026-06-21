import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FocusedFormDialog } from './FocusedFormDialog'

afterEach(() => {
  cleanup()
})

describe('FocusedFormDialog', () => {
  it('renders dialog content with title and description when open', () => {
    render(
      <FocusedFormDialog
        description="Create a subtask without stretching the task card."
        isOpen
        onClose={vi.fn()}
        title="Create subtask"
      >
        <div>Subtask form content</div>
      </FocusedFormDialog>,
    )

    expect(screen.getByRole('dialog', { name: 'Create subtask' })).not.toBeNull()
    expect(screen.getByText('Create a subtask without stretching the task card.')).not.toBeNull()
    expect(screen.getByText('Subtask form content')).not.toBeNull()
  })

  it('calls the close handler from the explicit close action', () => {
    const onClose = vi.fn()

    render(
      <FocusedFormDialog isOpen onClose={onClose} title="Edit subtask">
        <div>Subtask form content</div>
      </FocusedFormDialog>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls the close handler when clicking the backdrop', () => {
    const onClose = vi.fn()

    render(
      <FocusedFormDialog isOpen onClose={onClose} title="Edit subtask">
        <div>Subtask form content</div>
      </FocusedFormDialog>,
    )

    const backdrop = document.querySelector('.focused-form-dialog__backdrop')
    expect(backdrop).not.toBeNull()
    if (backdrop) {
      fireEvent.click(backdrop)
    }

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call the close handler when clicking inside the dialog content', () => {
    const onClose = vi.fn()

    render(
      <FocusedFormDialog isOpen onClose={onClose} title="Edit subtask">
        <div data-testid="dialog-inner">Subtask form content</div>
      </FocusedFormDialog>,
    )

    fireEvent.click(screen.getByTestId('dialog-inner'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not render when closed', () => {
    render(
      <FocusedFormDialog isOpen={false} onClose={vi.fn()} title="Create subtask">
        <div>Subtask form content</div>
      </FocusedFormDialog>,
    )

    expect(screen.queryByRole('dialog', { name: 'Create subtask' })).toBeNull()
  })
})
