export type AIProviderErrorCode =
  | 'authentication_failed'
  | 'invalid_response'
  | 'missing_configuration'
  | 'network_error'
  | 'provider_error'
  | 'unsupported_feature'

export class AIProviderError extends Error {
  code: AIProviderErrorCode

  constructor(code: AIProviderErrorCode, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'AIProviderError'
    this.code = code
  }
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const redactSecretValues = (message: string, secrets: string[]): string => {
  let redactedMessage = message

  for (const secret of secrets) {
    const trimmedSecret = secret.trim()

    if (trimmedSecret.length === 0) {
      continue
    }

    redactedMessage = redactedMessage.replace(new RegExp(escapeRegExp(trimmedSecret), 'g'), '[REDACTED]')
    redactedMessage = redactedMessage.replace(
      new RegExp(`Bearer\\s+${escapeRegExp(trimmedSecret)}`, 'gi'),
      'Bearer [REDACTED]',
    )
  }

  return redactedMessage
}

export const redactSecrets = (message: string, secrets: string[]): string => redactSecretValues(message, secrets)

export const createMissingConfigurationError = (): AIProviderError =>
  new AIProviderError('missing_configuration', 'Add a Groq API key before using AI provider actions.')

export const createMissingModelConfigurationError = (operation = 'AI project planning'): AIProviderError =>
  new AIProviderError('missing_configuration', `Select an AI model before using ${operation}.`)

export const createUnsupportedAIProviderOperationError = (operation: string): AIProviderError =>
  new AIProviderError('unsupported_feature', `${operation} is not implemented in this slice.`)

export const normalizeAIProviderError = (error: unknown, secrets: string[]): AIProviderError => {
  if (error instanceof AIProviderError) {
    return new AIProviderError(error.code, redactSecretValues(error.message, secrets), { cause: error.cause })
  }

  if (error instanceof Error) {
    const code: AIProviderErrorCode = error.name === 'TypeError' ? 'network_error' : 'provider_error'
    return new AIProviderError(code, redactSecretValues(error.message, secrets), { cause: error })
  }

  return new AIProviderError('provider_error', 'The AI provider returned an unexpected error.')
}
