import type { AppSettings } from '../entities'

export interface SettingsRepository {
  get(): Promise<AppSettings>
  save(settings: AppSettings): Promise<AppSettings>
  reset(): Promise<AppSettings>
}
