import { useContext } from 'react'
import { ToastContext } from './toast-context'

export const useToast = () => {
  const context = useContext(ToastContext)

  if (context === null) {
    throw new Error('ToastProvider is missing.')
  }

  return context
}
