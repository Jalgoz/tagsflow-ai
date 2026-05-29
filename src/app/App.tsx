import { useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import {
  LocalBackupRepositoryProvider,
  MemberManagementRepositoryProvider,
  OnboardingStateRepositoryProvider,
  ProjectRepositoryProvider,
  SettingsRepositoryProvider,
  SubtaskRepositoryProvider,
  TagManagementRepositoryProvider,
  TaskRepositoryProvider,
} from '../application'
import { ToastProvider } from '../presentation/feedback'
import { AppShell } from '../presentation/layouts/AppShell'
import { OnboardingGate } from '../presentation/components/OnboardingGate'
import { DashboardPage } from '../presentation/pages/DashboardPage'
import { KanbanPage } from '../presentation/pages/KanbanPage'
import { MembersPage } from '../presentation/pages/MembersPage'
import { NotFoundPage } from '../presentation/pages/NotFoundPage'
import { ProjectDetailPage } from '../presentation/pages/ProjectDetailPage'
import { ProjectsPage } from '../presentation/pages/ProjectsPage'
import { SettingsPage } from '../presentation/pages/SettingsPage'
import { TasksPage } from '../presentation/pages/TasksPage'
import { createLocalStorageRepositories } from '../infrastructure'
import { APP_ROUTE_PATHS } from '../shared/constants/routes'
import { AppThemeSync } from './AppThemeSync'

export const App = () => {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false,
          },
        },
      }),
    [],
  )

  const repositories = useMemo(() => createLocalStorageRepositories(), [])

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ProjectRepositoryProvider repository={repositories.projects}>
          <TaskRepositoryProvider repository={repositories.tasks}>
            <SubtaskRepositoryProvider repository={repositories.subtasks}>
              <SettingsRepositoryProvider repository={repositories.settings}>
                <LocalBackupRepositoryProvider repository={repositories.backups}>
                  <OnboardingStateRepositoryProvider repository={repositories.onboardingState}>
                    <AppThemeSync />
                    <MemberManagementRepositoryProvider
                      repositories={{
                        members: repositories.members,
                        projects: repositories.projects,
                        tasks: repositories.tasks,
                        subtasks: repositories.subtasks,
                      }}
                    >
                      <TagManagementRepositoryProvider
                        repositories={{
                          tags: repositories.tags,
                          tasks: repositories.tasks,
                          subtasks: repositories.subtasks,
                        }}
                      >
                        <BrowserRouter>
                          <Routes>
                            <Route path="/" element={<AppShell />}>
                              <Route element={<OnboardingGate />}>
                                <Route index element={<Navigate replace to={APP_ROUTE_PATHS.dashboard} />} />
                                <Route path={APP_ROUTE_PATHS.dashboard.slice(1)} element={<DashboardPage />} />
                                <Route path={APP_ROUTE_PATHS.projects.slice(1)} element={<ProjectsPage />} />
                                <Route
                                  path={`${APP_ROUTE_PATHS.projectDetailBase.slice(1)}/:projectId`}
                                  element={<ProjectDetailPage />}
                                />
                                <Route path={APP_ROUTE_PATHS.tasks.slice(1)} element={<TasksPage />} />
                                <Route path={APP_ROUTE_PATHS.kanban.slice(1)} element={<KanbanPage />} />
                                <Route path={APP_ROUTE_PATHS.members.slice(1)} element={<MembersPage />} />
                                <Route path={APP_ROUTE_PATHS.settings.slice(1)} element={<SettingsPage />} />
                              </Route>
                              <Route path="*" element={<NotFoundPage />} />
                            </Route>
                          </Routes>
                        </BrowserRouter>
                      </TagManagementRepositoryProvider>
                    </MemberManagementRepositoryProvider>
                  </OnboardingStateRepositoryProvider>
                </LocalBackupRepositoryProvider>
              </SettingsRepositoryProvider>
            </SubtaskRepositoryProvider>
          </TaskRepositoryProvider>
        </ProjectRepositoryProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
