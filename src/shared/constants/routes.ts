export const APP_ROUTE_PATHS = {
  dashboard: '/dashboard',
  members: '/members',
  projectDetailBase: '/projects',
  projectDetail: '/projects/:projectId',
  projects: '/projects',
  kanban: '/kanban',
  settings: '/settings',
  tasks: '/tasks',
} as const

export const APP_NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: APP_ROUTE_PATHS.dashboard,
    shortPath: 'overview',
  },
  {
    label: 'Projects',
    path: APP_ROUTE_PATHS.projects,
    shortPath: 'workspace',
  },
  {
    label: 'Tasks',
    path: APP_ROUTE_PATHS.tasks,
    shortPath: 'all tasks',
  },
  {
    label: 'Kanban',
    path: APP_ROUTE_PATHS.kanban,
    shortPath: 'board',
  },
  {
    label: 'Members',
    path: APP_ROUTE_PATHS.members,
    shortPath: 'people',
  },
  {
    label: 'Settings',
    path: APP_ROUTE_PATHS.settings,
    shortPath: 'system',
  },
] as const
