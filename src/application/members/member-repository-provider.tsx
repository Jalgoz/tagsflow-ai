import type { PropsWithChildren } from 'react'
import type { MemberManagementRepositoryBundle } from './member-repository-context'
import { MemberManagementRepositoryContext } from './member-repository-context'

type MemberManagementRepositoryProviderProps = PropsWithChildren<{
  repositories: MemberManagementRepositoryBundle
}>

export const MemberManagementRepositoryProvider = ({
  children,
  repositories,
}: MemberManagementRepositoryProviderProps) => {
  return (
    <MemberManagementRepositoryContext.Provider value={repositories}>
      {children}
    </MemberManagementRepositoryContext.Provider>
  )
}
