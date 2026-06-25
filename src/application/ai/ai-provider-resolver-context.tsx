import { createContext, useContext } from 'react'
import type { AIProviderResolver } from './ai-provider-resolver'

export const AIProviderResolverContext = createContext<AIProviderResolver | null>(null)

export const useAIProviderResolver = (): AIProviderResolver => {
  const resolver = useContext(AIProviderResolverContext)

  if (resolver === null) {
    throw new Error('AIProviderResolverProvider is missing.')
  }

  return resolver
}
