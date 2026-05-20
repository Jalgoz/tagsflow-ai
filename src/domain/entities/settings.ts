export type ThemeMode = 'light' | 'dark'

export interface AIProviderConfiguration {
  provider: 'groq'
  apiKey: string | null
  selectedModelId: string | null
}

export interface ExportableAIProviderConfiguration {
  provider: AIProviderConfiguration['provider']
  selectedModelId: string | null
  hasApiKey: boolean
}

export interface AppSettings {
  theme: ThemeMode
  aiProvider: AIProviderConfiguration
}

export interface ExportableAppSettings {
  theme: ThemeMode
  aiProvider: ExportableAIProviderConfiguration
}
