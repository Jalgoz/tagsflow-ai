import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChecklistEditor } from './ChecklistEditor'

afterEach(() => {
  cleanup()
})

describe('ChecklistEditor', () => {
  it('adds checklist items with text and completed state', () => {
    const onChange = vi.fn()

    render(<ChecklistEditor items={[]} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('New checklist item'), { target: { value: 'Review copy' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(onChange).toHaveBeenCalledWith([{ completed: false, text: 'Review copy' }])
  })

  it('toggles and removes checklist items', () => {
    const onChange = vi.fn()

    render(<ChecklistEditor items={[{ completed: false, text: 'Review copy' }]} onChange={onChange} />)

    fireEvent.click(screen.getByLabelText('Complete Review copy'))
    expect(onChange).toHaveBeenCalledWith([{ completed: true, text: 'Review copy' }])

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(onChange).toHaveBeenCalledWith([])
  })
})
