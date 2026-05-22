import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

afterEach(() => {
  cleanup()
})

describe('ConfirmDialog', () => {
  it('renders title and description when open', () => {
    render(
      <ConfirmDialog
        description="This action cannot be undone."
        isOpen
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete this project?"
      />,
    )

    expect(screen.getByRole('alertdialog', { name: 'Delete this project?' })).not.toBeNull()
    expect(screen.getByText('This action cannot be undone.')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Cancel' })).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Confirm' })).not.toBeNull()
  })

  it('calls the cancel handler without confirming the destructive action', () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()

    render(
      <ConfirmDialog
        description="Delete the member and clean up references."
        isOpen
        onCancel={onCancel}
        onConfirm={onConfirm}
        title="Delete assigned member?"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('calls the confirm handler when the destructive action is confirmed', () => {
    const onConfirm = vi.fn()

    render(
      <ConfirmDialog
        confirmLabel="Delete member"
        description="Delete the member and clean up references."
        isOpen
        onCancel={vi.fn()}
        onConfirm={onConfirm}
        title="Delete assigned member?"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete member' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('disables conflicting actions and shows the pending label while the mutation is in progress', () => {
    render(
      <ConfirmDialog
        confirmLabel="Delete tag"
        description="Delete the tag from the catalog."
        isOpen
        isPending
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        pendingLabel="Deleting tag..."
        title="Delete this tag?"
      />,
    )

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'Deleting tag...' })).toHaveProperty('disabled', true)
  })
})
