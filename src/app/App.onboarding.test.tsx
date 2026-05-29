import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LOCAL_STORAGE_DATABASE_KEY, LOCAL_STORAGE_ONBOARDING_KEY } from '../shared'
import App from './App'

describe('App onboarding flow', () => {
  beforeEach(() => {
    localStorage.removeItem(LOCAL_STORAGE_DATABASE_KEY)
    localStorage.removeItem(LOCAL_STORAGE_ONBOARDING_KEY)
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    cleanup()
  })

  it('shows onboarding choices for an eligible empty workspace', async () => {
    render(<App />)

    expect(await screen.findByText('Choose how to start this local workspace')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Start empty' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Load demo data' })).toBeTruthy()
  })

  it('loads demo data and shows it in routed modules', async () => {
    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: 'Load demo data' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Workspace overview' })).toBeTruthy()
    })
    expect((await screen.findAllByText('Development of a SaaS Frontend Platform')).length).toBeGreaterThan(0)
  })
})
