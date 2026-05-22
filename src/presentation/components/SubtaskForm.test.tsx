import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Member, Tag } from '../../domain'
import { SubtaskForm } from './SubtaskForm'

afterEach(() => {
  cleanup()
})

const members: Member[] = []
const tags: Tag[] = []

describe('SubtaskForm', () => {
  it('renders required indicators and submits valid subtask values', async () => {
    const onSubmit = vi.fn()

    render(
      <SubtaskForm
        members={members}
        onCancel={() => undefined}
        onSubmit={onSubmit}
        submitLabel="Create subtask"
        tags={tags}
        title="Create subtask"
      />,
    )

    expect(screen.getByText('Title *')).not.toBeNull()
    expect(screen.getByText('Status *')).not.toBeNull()
    expect(screen.getByText('Priority *')).not.toBeNull()

    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Write tests' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create subtask' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'medium',
          status: 'todo',
          title: 'Write tests',
        }),
      ),
    )
  })
})
