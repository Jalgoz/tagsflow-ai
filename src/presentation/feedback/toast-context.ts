import { createContext } from 'react'

export type ToastVariant = 'success' | 'error'

export type ShowToastInput = {
  durationMs?: number
  message: string
  variant: ToastVariant
}

export type ToastContextValue = {
  dismissToast: (toastId: string) => void
  error: (message: string, durationMs?: number) => void
  showToast: (input: ShowToastInput) => void
  success: (message: string, durationMs?: number) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
