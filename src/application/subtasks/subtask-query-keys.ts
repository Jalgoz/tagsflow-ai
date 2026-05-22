export const subtaskQueryKeys = {
  all: ['subtasks'] as const,
  detail: (subtaskId: string) => [...subtaskQueryKeys.all, 'detail', subtaskId] as const,
  list: () => [...subtaskQueryKeys.all, 'list'] as const,
  taskList: (taskId: string) => [...subtaskQueryKeys.all, 'task', taskId] as const,
}
