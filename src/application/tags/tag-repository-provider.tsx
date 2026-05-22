import type { PropsWithChildren } from 'react'
import type { TagManagementRepositoryBundle } from './tag-repository-context'
import { TagManagementRepositoryContext } from './tag-repository-context'

type TagManagementRepositoryProviderProps = PropsWithChildren<{
  repositories: TagManagementRepositoryBundle
}>

export const TagManagementRepositoryProvider = ({ children, repositories }: TagManagementRepositoryProviderProps) => {
  return <TagManagementRepositoryContext.Provider value={repositories}>{children}</TagManagementRepositoryContext.Provider>
}
