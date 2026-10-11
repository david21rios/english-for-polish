import React, { useEffect, useState } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const authModule = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('firebase/auth', () => authModule)

import { onAuthStateChanged, signOut } from 'firebase/auth'

function InfrastructureProbe() {
  const [ready, setReady] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    sessionStorage.setItem('phase04-session-storage', 'ready')
    localStorage.setItem('phase04-local-storage', 'ready')

    const timer = setTimeout(() => setReady(true), 0)

    return () => {
      clearTimeout(timer)
      sessionStorage.removeItem('phase04-session-storage')
      localStorage.removeItem('phase04-local-storage')
    }
  }, [])

  return (
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      {ready ? `ready:${count}` : 'loading'}
    </button>
  )
}

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  localStorage.clear()
  vi.clearAllMocks()
})

describe('React session test infrastructure', () => {
  it('supports React 19 JSX, effects, state, async act, storage, and unmount cleanup', async () => {
    expect(React.version).toMatch(/^19\./)

    render(<InfrastructureProbe />)

    await waitFor(() => {
      expect(screen.getByRole('button').textContent).toBe('ready:0')
    })
    expect(sessionStorage.getItem('phase04-session-storage')).toBe('ready')
    expect(localStorage.getItem('phase04-local-storage')).toBe('ready')

    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })
    expect(screen.getByRole('button').textContent).toBe('ready:1')

    cleanup()
    expect(sessionStorage.getItem('phase04-session-storage')).toBeNull()
    expect(localStorage.getItem('phase04-local-storage')).toBeNull()
  })

  it('supports Vitest Firebase Auth module mocking without provider access', () => {
    const unsubscribe = vi.fn()
    const observer = vi.fn()
    authModule.onAuthStateChanged.mockImplementationOnce((_auth, callback) => {
      callback({ uid: 'phase04-smoke-user' })
      return unsubscribe
    })

    const stop = onAuthStateChanged({}, observer)
    expect(observer).toHaveBeenCalledWith({ uid: 'phase04-smoke-user' })
    expect(stop).toBe(unsubscribe)

    signOut({})
    expect(signOut).toHaveBeenCalledTimes(1)
  })
})
