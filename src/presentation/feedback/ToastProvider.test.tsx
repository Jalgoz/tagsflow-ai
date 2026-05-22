import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from './ToastProvider'
import { useToast } from './useToast'

const ToastHarness = () => {
  const toast = useToast()

  return (
    <div>
      <button type="button" onClick={() => toast.success('Project created.')}>
        Success
      </button>
      <button type="button" onClick={() => toast.error('Unable to save project.')}>
        Error
      </button>
      <button
        type="button"
        onClick={() =>
          toast.showToast({
            durationMs: 50,
            message: 'Short toast.',
            variant: 'success',
          })
        }
      >
        Timed
      </button>
    </div>
  )
}

describe('ToastProvider', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('renders success notifications', () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Success' }))

    expect(screen.getByRole('status').textContent).toContain('Project created.')
  })

  it('renders error notifications and dismisses them manually', () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Error' }))

    expect(screen.getByRole('alert').textContent).toContain('Unable to save project.')

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss error notification' }))

    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('auto-dismisses notifications after their configured duration', () => {
    vi.useFakeTimers()

    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Timed' }))
    expect(screen.getByRole('status').textContent).toContain('Short toast.')

    act(() => {
      vi.advanceTimersByTime(60)
    })

    expect(screen.queryByText('Short toast.')).toBeNull()
  })
})
