import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { TasksPage } from './TasksPage'

afterEach(() => {
  cleanup()
})

describe('TasksPage', () => {
  it('remains a placeholder for the global tasks table', () => {
    render(<TasksPage />)

    expect(screen.getByRole('heading', { name: 'Global tasks view' })).not.toBeNull()
    expect(screen.getByText('The global tasks table and editing flows will arrive in a later implementation slice.')).not.toBeNull()
    expect(screen.queryByRole('table')).toBeNull()
  })
})
