import { useEffect } from 'react'
import { useSettings } from '../application'

export const AppThemeSync = () => {
  const { data: settings } = useSettings()

  useEffect(() => {
    if (settings === undefined) {
      return
    }

    document.documentElement.setAttribute('data-theme', settings.theme)
  }, [settings])

  return null
}
