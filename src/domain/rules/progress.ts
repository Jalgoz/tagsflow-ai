import type { Project, Subtask, Task } from '../entities'

interface TaskProgressInput {
  task: Task
  subtasks?: Subtask[]
}

interface ProjectProgressInput {
  project: Project
  tasks: Task[]
  subtasks?: Subtask[]
}

const getTaskSubtasks = (task: Task, subtasks: Subtask[]): Subtask[] => {
  if (task.subtaskIds.length === 0) {
    return []
  }

  return subtasks.filter((subtask) => subtask.taskId === task.id && task.subtaskIds.includes(subtask.id))
}

/**
 * Calculates task progress using done status when no subtasks exist and completion ratio when subtasks are present.
 */
export const calculateTaskProgress = ({ task, subtasks = [] }: TaskProgressInput): number => {
  const taskSubtasks = getTaskSubtasks(task, subtasks)

  if (taskSubtasks.length === 0) {
    return task.status === 'done' ? 100 : 0
  }

  const completedSubtasks = taskSubtasks.filter((subtask) => subtask.status === 'done').length
  return (completedSubtasks / taskSubtasks.length) * 100
}

/**
 * Calculates project progress as the average of top-level task progress values.
 */
export const calculateProjectProgress = ({ project, tasks, subtasks = [] }: ProjectProgressInput): number => {
  const projectTasks = tasks.filter((task) => task.projectId === project.id && project.taskIds.includes(task.id))

  if (projectTasks.length === 0) {
    return 0
  }

  const totalProgress = projectTasks.reduce((sum, task) => sum + calculateTaskProgress({ task, subtasks }), 0)
  return totalProgress / projectTasks.length
}
