import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import {
  buildDashboardMetrics,
  useMembers,
  useProjects,
  useSubtasks,
  useTags,
  useTasks,
  type DashboardDistributionPoint,
} from '../../application'
import type { Priority, TaskStatus } from '../../domain'
import { APP_ROUTE_PATHS, TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '../../shared/constants'
import { TagBadge } from '../components/TagBadge'
import { DASHBOARD_TASK_FILTER_PARAM, DASHBOARD_TASK_SEARCH_PARAM, type DashboardTaskFilterPreset } from './global-tasks'

interface DashboardMetricCardProps {
  title: string
  value: string
  description: string
  to?: string
}

const CHART_HEIGHT = 260
const STATUS_CHART_WIDTH = 560
const PRIORITY_CHART_WIDTH = 420

const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: '#64748b',
  blocked: '#f97316',
  done: '#22c55e',
  in_progress: '#6366f1',
  review: '#8b5cf6',
  todo: '#3b82f6',
}

const PRIORITY_COLORS: Record<Priority, string> = {
  high: '#ef4444',
  low: '#10b981',
  medium: '#eab308',
  urgent: '#dc2626',
}

const getReferenceDate = (): string => new Date().toISOString().slice(0, 10)

const formatDate = (value: string | null): string => {
  if (value === null || value.trim() === '') {
    return 'Not set'
  }

  return value
}

const formatPercentage = (value: number): string => `${Math.round(value)}%`

const hasNonZeroDistributionData = <Key extends string>(data: DashboardDistributionPoint<Key>[]): boolean =>
  data.some((item) => item.count > 0)

const createTaskFilterLink = (preset: DashboardTaskFilterPreset): string => {
  const params = new URLSearchParams({ [DASHBOARD_TASK_FILTER_PARAM]: preset })
  return `${APP_ROUTE_PATHS.tasks}?${params.toString()}`
}

const createTaskSearchLink = (taskTitle: string): string => {
  const params = new URLSearchParams({
    [DASHBOARD_TASK_FILTER_PARAM]: 'all',
    [DASHBOARD_TASK_SEARCH_PARAM]: taskTitle,
  })

  return `${APP_ROUTE_PATHS.tasks}?${params.toString()}`
}

const DashboardMetricCard = ({ title, value, description, to }: DashboardMetricCardProps) => {
  const content = (
    <>
      <p className="dashboard-metric-card__title">{title}</p>
      <p className="dashboard-metric-card__value">{value}</p>
      <p className="dashboard-metric-card__description">{description}</p>
    </>
  )

  if (to === undefined) {
    return <article className="dashboard-metric-card">{content}</article>
  }

  return (
    <Link className="dashboard-metric-card dashboard-metric-card--link" to={to}>
      {content}
    </Link>
  )
}

export const DashboardPage = () => {
  const [isSummaryMetricsExpanded, setIsSummaryMetricsExpanded] = useState(false)
  const projectsQuery = useProjects()
  const tasksQuery = useTasks()
  const subtasksQuery = useSubtasks()
  const membersQuery = useMembers()
  const tagsQuery = useTags()

  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data])
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data])
  const subtasks = useMemo(() => subtasksQuery.data ?? [], [subtasksQuery.data])
  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data])
  const tags = useMemo(() => tagsQuery.data ?? [], [tagsQuery.data])

  const isLoading =
    projectsQuery.isLoading || tasksQuery.isLoading || subtasksQuery.isLoading || membersQuery.isLoading || tagsQuery.isLoading
  const isError = projectsQuery.isError || tasksQuery.isError || subtasksQuery.isError || membersQuery.isError || tagsQuery.isError

  const firstError = [projectsQuery.error, tasksQuery.error, subtasksQuery.error, membersQuery.error, tagsQuery.error].find(
    (error): error is Error => error instanceof Error,
  )

  const referenceDate = useMemo(() => getReferenceDate(), [])

  const metrics = useMemo(
    () =>
      buildDashboardMetrics({
        members,
        projects,
        referenceDate,
        subtasks,
        tags,
        tasks,
      }),
    [members, projects, referenceDate, subtasks, tags, tasks],
  )

  const statusChartData = metrics.taskStatusDistribution.map((item) => ({
    color: STATUS_COLORS[item.key],
    label: TASK_STATUS_LABELS[item.key],
    status: item.key,
    value: item.count,
  }))

  const priorityChartData = metrics.taskPriorityDistribution.map((item) => ({
    color: PRIORITY_COLORS[item.key],
    label: TASK_PRIORITY_LABELS[item.key],
    priority: item.key,
    value: item.count,
  }))

  return (
    <section className="project-workspace dashboard-page">
      <div className="project-workspace__header">
        <div>
          <p className="project-workspace__eyebrow">Dashboard</p>
          <h2 className="project-workspace__title">Workspace overview</h2>
          <p className="project-workspace__description">
            Track project health, workload distribution, and near-term deadlines from current local data.
          </p>
        </div>
        <Link className="project-workspace__action dashboard-page__primary-action" to={APP_ROUTE_PATHS.projects}>
          Open projects
        </Link>
      </div>

      {isLoading ? <div className="project-state">Loading dashboard data...</div> : null}

      {isError ? (
        <div className="project-state project-state--error">
          Unable to load dashboard data.
          <span>{firstError?.message ?? 'Unknown error'}</span>
        </div>
      ) : null}

      {!isLoading && !isError && projects.length === 0 ? (
        <div className="project-empty-state">
          <div>
            <p className="project-empty-state__eyebrow">No projects yet</p>
            <h3 className="project-empty-state__title">Create the first project workspace</h3>
            <p className="project-empty-state__description">
              The dashboard summarizes existing projects. Create a project first to unlock metrics and charts.
            </p>
          </div>
          <Link className="project-workspace__action" to={APP_ROUTE_PATHS.projects}>
            Go to projects
          </Link>
        </div>
      ) : null}

      {!isLoading && !isError && projects.length > 0 ? (
        <>
          <section
            className={`dashboard-section dashboard-section--summary${
              isSummaryMetricsExpanded ? ' dashboard-section--summary-expanded' : ' dashboard-section--summary-collapsed'
            }`}
          >
            <div className="dashboard-section__header">
              <h3 className="dashboard-section__title">Summary metrics</h3>
              <button
                aria-controls="dashboard-summary-metrics"
                aria-expanded={isSummaryMetricsExpanded}
                className="dashboard-section__toggle"
                type="button"
                onClick={() => setIsSummaryMetricsExpanded((currentState) => !currentState)}
              >
                <span>{isSummaryMetricsExpanded ? 'Hide' : 'Show'}</span>
                <span
                  aria-hidden="true"
                  className={`dashboard-section__toggle-icon${isSummaryMetricsExpanded ? ' dashboard-section__toggle-icon--open' : ''}`}
                >
                  ▾
                </span>
              </button>
            </div>
            <div
              className={`dashboard-metric-grid${isSummaryMetricsExpanded ? '' : ' dashboard-metric-grid--collapsed'}`}
              id="dashboard-summary-metrics"
            >
              <DashboardMetricCard
                title="Active projects"
                value={String(metrics.projectStatusCounts.active)}
                description="Projects currently in active delivery."
                to={APP_ROUTE_PATHS.projects}
              />
              <DashboardMetricCard
                title="Paused projects"
                value={String(metrics.projectStatusCounts.paused)}
                description="Projects currently on hold."
                to={APP_ROUTE_PATHS.projects}
              />
              <DashboardMetricCard
                title="Completed projects"
                value={String(metrics.projectStatusCounts.completed)}
                description="Projects marked complete."
                to={APP_ROUTE_PATHS.projects}
              />
              <DashboardMetricCard
                title="Total tasks"
                value={String(metrics.taskCounts.total)}
                description="All top-level tasks across projects."
                to={createTaskFilterLink('all')}
              />
              <DashboardMetricCard
                title="Pending tasks"
                value={String(metrics.taskCounts.pending)}
                description="Tasks not yet in done status."
                to={createTaskFilterLink('pending')}
              />
              <DashboardMetricCard
                title="Completed tasks"
                value={String(metrics.taskCounts.completed)}
                description="Tasks in done status."
                to={createTaskFilterLink('completed')}
              />
              <DashboardMetricCard
                title="Blocked tasks"
                value={String(metrics.taskCounts.blocked)}
                description="Tasks currently blocked."
                to={createTaskFilterLink('blocked')}
              />
              <DashboardMetricCard
                title="Overdue tasks"
                value={String(metrics.overdueTaskCount)}
                description="Open tasks with due dates before today."
                to={createTaskFilterLink('overdue')}
              />
              <DashboardMetricCard
                title="Upcoming deadlines"
                value={String(metrics.upcomingDeadlineTaskCount)}
                description="Open tasks due within the next 7 days."
                to={createTaskFilterLink('upcoming')}
              />
              <DashboardMetricCard
                title="Average project progress"
                value={formatPercentage(metrics.averageProjectProgress)}
                description="Derived from top-level tasks and subtasks."
              />
              <DashboardMetricCard
                title="Completed this week"
                value={
                  metrics.completedThisWeek.isAvailable ? String(metrics.completedThisWeek.value) : 'Unavailable'
                }
                description={
                  metrics.completedThisWeek.isAvailable
                    ? 'Completed tasks with explicit completion dates this week.'
                    : metrics.completedThisWeek.reason
                }
              />
            </div>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section__header">
              <h3 className="dashboard-section__title">Project health overview</h3>
              <Link className="dashboard-section__link" to={APP_ROUTE_PATHS.projects}>
                Open projects
              </Link>
            </div>
            <div className="dashboard-project-grid">
              {metrics.projectHealthRows.map((row) => (
                <Link key={row.projectId} className="dashboard-project-row" to={`${APP_ROUTE_PATHS.projects}/${row.projectId}`}>
                  <div className="dashboard-project-row__title-group">
                    <h4>{row.title}</h4>
                    <p>{row.dueDate === null ? 'Due date not set' : `Due ${row.dueDate}`}</p>
                  </div>
                  <div className="dashboard-project-row__meta">
                    <span className={`project-status project-status--${row.status}`}>{row.status}</span>
                    <span className="dashboard-project-row__progress">{formatPercentage(row.progress)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="dashboard-section dashboard-section--charts">
            <article className="dashboard-chart-card">
              <h3 className="dashboard-section__title">Task status distribution</h3>
              {hasNonZeroDistributionData(metrics.taskStatusDistribution) ? (
                <div className="dashboard-chart-wrap">
                  <BarChart
                    aria-label="Task status distribution chart"
                    data={statusChartData}
                    height={CHART_HEIGHT}
                    width={STATUS_CHART_WIDTH}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" interval={0} tickMargin={8} />
                    <YAxis allowDecimals={false} />
                    <Bar dataKey="value" isAnimationActive={false} radius={[8, 8, 0, 0]}>
                      {statusChartData.map((entry) => (
                        <Cell key={entry.status} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </div>
              ) : (
                <div className="project-state">No task status data available yet.</div>
              )}
            </article>

            <article className="dashboard-chart-card">
              <h3 className="dashboard-section__title">Task priority distribution</h3>
              {hasNonZeroDistributionData(metrics.taskPriorityDistribution) ? (
                <div className="dashboard-chart-wrap">
                  <BarChart
                    aria-label="Task priority distribution chart"
                    data={priorityChartData}
                    height={CHART_HEIGHT}
                    width={PRIORITY_CHART_WIDTH}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" interval={0} tickMargin={8} />
                    <YAxis allowDecimals={false} />
                    <Bar dataKey="value" isAnimationActive={false} radius={[8, 8, 0, 0]}>
                      {priorityChartData.map((entry) => (
                        <Cell key={entry.priority} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </div>
              ) : (
                <div className="project-state">No task priority data available yet.</div>
              )}
            </article>
          </section>

          <section className="dashboard-section dashboard-section--lists">
            <article className="dashboard-list-card">
              <h3 className="dashboard-section__title">Upcoming deadlines</h3>
              {metrics.upcomingDeadlineTasks.length === 0 ? (
                <div className="project-state">No upcoming deadlines in the next 7 days.</div>
              ) : (
                <div className="dashboard-task-list">
                  {metrics.upcomingDeadlineTasks.map((task) => {
                    return (
                      <Link key={task.taskId} className="dashboard-task-row dashboard-task-row--link" to={createTaskSearchLink(task.title)}>
                        <div className="dashboard-task-row__title-group">
                          <h4>{task.title}</h4>
                          <p>{task.projectTitle}</p>
                        </div>
                        <div className="dashboard-task-row__meta">
                          <span className={`project-status project-status--${task.status}`}>{TASK_STATUS_LABELS[task.status]}</span>
                          <span className={`task-priority task-priority--${task.priority}`}>{TASK_PRIORITY_LABELS[task.priority]}</span>
                          <span>{formatDate(task.dueDate)}</span>
                          <span>{task.assigneeName}</span>
                        </div>
                        <div className="dashboard-task-row__tags">
                          {task.tags.length === 0 ? <span className="dashboard-task-row__muted">No tags</span> : null}
                          {task.tags.map((tag) => (
                            <TagBadge key={tag.id} tag={tag} />
                          ))}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </article>

            <article className="dashboard-list-card">
              <h3 className="dashboard-section__title">Blocked work</h3>
              {metrics.blockedTasks.length === 0 ? (
                <div className="project-state">No blocked tasks right now.</div>
              ) : (
                <div className="dashboard-task-list">
                  {metrics.blockedTasks.map((task) => {
                    return (
                      <Link key={task.taskId} className="dashboard-task-row dashboard-task-row--link" to={createTaskSearchLink(task.title)}>
                        <div className="dashboard-task-row__title-group">
                          <h4>{task.title}</h4>
                          <p>{task.projectTitle}</p>
                        </div>
                        <div className="dashboard-task-row__meta">
                          <span className={`project-status project-status--${task.status}`}>{TASK_STATUS_LABELS[task.status]}</span>
                          <span className={`task-priority task-priority--${task.priority}`}>{TASK_PRIORITY_LABELS[task.priority]}</span>
                          <span>{formatDate(task.dueDate)}</span>
                          <span>{task.assigneeName}</span>
                        </div>
                        <div className="dashboard-task-row__tags">
                          {task.tags.length === 0 ? <span className="dashboard-task-row__muted">No tags</span> : null}
                          {task.tags.map((tag) => (
                            <TagBadge key={tag.id} tag={tag} />
                          ))}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </article>
          </section>

          <section className="dashboard-section">
            <h3 className="dashboard-section__title">Recently completed work</h3>
            {metrics.recentlyCompletedWork.isAvailable ? (
              metrics.recentlyCompletedWork.items.length === 0 ? (
                <div className="project-state">No recently completed tasks in the current range.</div>
              ) : (
                <div className="dashboard-task-list">
                  {metrics.recentlyCompletedWork.items.map((task) => (
                    <article key={task.taskId} className="dashboard-task-row">
                      <div className="dashboard-task-row__title-group">
                        <h4>{task.title}</h4>
                        <p>{task.projectTitle}</p>
                      </div>
                      <div className="dashboard-task-row__meta">
                        <span className={`project-status project-status--${task.status}`}>{TASK_STATUS_LABELS[task.status]}</span>
                        <span className={`task-priority task-priority--${task.priority}`}>{TASK_PRIORITY_LABELS[task.priority]}</span>
                        <span>Completed {task.completedAt}</span>
                        <span>{task.assigneeName}</span>
                      </div>
                      <div className="dashboard-task-row__tags">
                        {task.tags.length === 0 ? <span className="dashboard-task-row__muted">No tags</span> : null}
                        {task.tags.map((tag) => (
                          <TagBadge key={tag.id} tag={tag} />
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )
            ) : (
              <div className="project-state">{metrics.recentlyCompletedWork.reason}</div>
            )}
          </section>
        </>
      ) : null}
    </section>
  )
}
