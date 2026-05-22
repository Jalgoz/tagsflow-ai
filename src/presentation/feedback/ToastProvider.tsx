import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react'
import { ToastContext, type ShowToastInput, type ToastContextValue, type ToastVariant } from './toast-context'

type ToastRecord = {
  id: string
  durationMs: number
  message: string
  variant: ToastVariant
}

const DEFAULT_SUCCESS_DURATION_MS = 4000
const DEFAULT_ERROR_DURATION_MS = 6000

const createToastId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const timersRef = useRef<Map<string, number>>(new Map())

  const dismissToast = useCallback((toastId: string) => {
    const timeoutId = timersRef.current.get(toastId)

    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId)
      timersRef.current.delete(toastId)
    }

    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId))
  }, [])

  const showToast = useCallback(
    ({ durationMs, message, variant }: ShowToastInput) => {
      const toastId = createToastId()
      const resolvedDurationMs =
        durationMs ?? (variant === 'error' ? DEFAULT_ERROR_DURATION_MS : DEFAULT_SUCCESS_DURATION_MS)

      setToasts((currentToasts) => [
        ...currentToasts,
        {
          id: toastId,
          durationMs: resolvedDurationMs,
          message,
          variant,
        },
      ])

      const timeoutId = window.setTimeout(() => {
        dismissToast(toastId)
      }, resolvedDurationMs)

      timersRef.current.set(toastId, timeoutId)
    },
    [dismissToast],
  )

  const success = useCallback(
    (message: string, durationMs?: number) => {
      showToast({ durationMs, message, variant: 'success' })
    },
    [showToast],
  )

  const error = useCallback(
    (message: string, durationMs?: number) => {
      showToast({ durationMs, message, variant: 'error' })
    },
    [showToast],
  )

  useEffect(() => {
    const activeTimers = timersRef.current

    return () => {
      for (const timeoutId of activeTimers.values()) {
        window.clearTimeout(timeoutId)
      }

      activeTimers.clear()
    }
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({
      dismissToast,
      error,
      showToast,
      success,
    }),
    [dismissToast, error, showToast, success],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-atomic="false" aria-live="polite" className="toast-stack">
        {toasts.map((toast) => (
          <section
            key={toast.id}
            aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
            className={`toast toast--${toast.variant}`}
            role={toast.variant === 'error' ? 'alert' : 'status'}
          >
            <div className="toast__body">
              <p className="toast__label">{toast.variant === 'error' ? 'Error' : 'Success'}</p>
              <p className="toast__message">{toast.message}</p>
            </div>
            <button
              aria-label={`Dismiss ${toast.variant} notification`}
              className="toast__dismiss"
              type="button"
              onClick={() => dismissToast(toast.id)}
            >
              Dismiss
            </button>
          </section>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
