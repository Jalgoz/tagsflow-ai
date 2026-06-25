export const aiQueryKeys = {
  all: () => ['ai'] as const,
  configuration: () => ['ai', 'configuration'] as const,
  models: (providerId: string, keySource: 'override' | 'saved' | 'missing') =>
    ['ai', 'models', providerId, keySource] as const,
}
