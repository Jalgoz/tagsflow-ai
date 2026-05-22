export const taskQueryKeys = {
  all: ['tasks'] as const,
  detail: (taskId: string) => [...taskQueryKeys.all, 'detail', taskId] as const,
  list: () => [...taskQueryKeys.all, 'list'] as const,
  projectList: (projectId: string) => [...taskQueryKeys.all, 'project', projectId] as const,
}
