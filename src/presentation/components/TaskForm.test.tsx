import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Member, Tag } from '../../domain'
import { TaskForm } from './TaskForm'

afterEach(() => {
  cleanup()
})

const members: Member[] = [
  {
    id: 'member-1',
    avatar: '',
    email: 'dev@example.com',
    name: 'Dev One',
    role: 'Developer',
  },
]

const tags: Tag[] = [
  {
    id: 'tag-1',
    color: '#4f46e5',
    name: 'Frontend',
  },
]

describe('TaskForm', () => {
  it('renders required indicators and validation messages', async () => {
    render(
      <TaskForm
        members={members}
        onCancel={() => undefined}
        onSubmit={() => undefined}
        submitLabel="Create task"
        tags={tags}
        title="Create task"
      />,
    )

    expect(screen.getByText('Title *')).not.toBeNull()
    expect(screen.getByText('Status *')).not.toBeNull()
    expect(screen.getByText('Priority *')).not.toBeNull()
    expect(screen.getByText('Description')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Create task' }))

    await waitFor(() => expect(screen.getByText('Title is required.')).not.toBeNull())
  })

  it('submits valid task form values and cancels', async () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    render(
      <TaskForm
        members={members}
        onCancel={onCancel}
        onSubmit={onSubmit}
        submitLabel="Create task"
        tags={tags}
        title="Create task"
      />,
    )

    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Build task UI' } })
    fireEvent.change(screen.getByLabelText(/Assignee/), { target: { value: 'member-1' } })
    fireEvent.click(screen.getByLabelText(/Frontend/))
    fireEvent.click(screen.getByRole('button', { name: 'Create task' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          assigneeMemberId: 'member-1',
          priority: 'medium',
          status: 'todo',
          tagIds: ['tag-1'],
          title: 'Build task UI',
        }),
      ),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
  })
})
