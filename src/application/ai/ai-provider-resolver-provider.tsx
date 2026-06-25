import type { PropsWithChildren } from 'react'
import type { AIProviderResolver } from './ai-provider-resolver'
import { AIProviderResolverContext } from './ai-provider-resolver-context'

type AIProviderResolverProviderProps = PropsWithChildren<{
  resolver: AIProviderResolver
}>

export const AIProviderResolverProvider = ({ children, resolver }: AIProviderResolverProviderProps) => {
  return <AIProviderResolverContext.Provider value={resolver}>{children}</AIProviderResolverContext.Provider>
}
