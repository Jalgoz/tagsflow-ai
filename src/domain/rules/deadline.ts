import type { Subtask, Task } from '../entities'

export interface DeadlineTrackedItem {
  dueDate: string | null
  status: Task['status']
}

export interface UpcomingDeadlineOptions {
  windowDays: number
  referenceDate: string
}

const toTime = (value: string): number => {
  const time = Date.parse(value)
  if (Number.isNaN(time)) {
    throw new Error(`Invalid date value: ${value}`)
  }

  return time
}

const isOpenItem = (item: DeadlineTrackedItem): boolean => item.status !== 'done'

export const isOverdueItem = (item: DeadlineTrackedItem, referenceDate: string): boolean => {
  if (!item.dueDate || !isOpenItem(item)) {
    return false
  }

  return toTime(item.dueDate) < toTime(referenceDate)
}

export const getOverdueTasks = (items: Array<Task | Subtask>, referenceDate: string): Array<Task | Subtask> =>
  items.filter((item) => isOverdueItem(item, referenceDate))

export const getUpcomingDeadlineTasks = (
  items: Array<Task | Subtask>,
  options: UpcomingDeadlineOptions,
): Array<Task | Subtask> => {
  const referenceTime = toTime(options.referenceDate)
  const windowEnd = referenceTime + options.windowDays * 24 * 60 * 60 * 1000

  return items.filter((item) => {
    if (!item.dueDate || !isOpenItem(item)) {
      return false
    }

    const dueTime = toTime(item.dueDate)
    return dueTime >= referenceTime && dueTime <= windowEnd
  })
}
