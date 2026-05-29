import type { AppSettings, Member, Project, Subtask, Tag, Task, ValidatedLocalBackupData } from '../../domain'

const DEMO_IDS = {
  members: {
    productLead: 'demo-member-product-lead',
    frontendLead: 'demo-member-frontend-lead',
    qaEngineer: 'demo-member-qa-engineer',
    uiDesigner: 'demo-member-ui-designer',
  },
  project: 'demo-project-saas-frontend-platform',
  subtasks: {
    workflowDnD: 'demo-subtask-workflow-dnd',
    taskFiltersQuery: 'demo-subtask-task-filters-query',
    taskFiltersUi: 'demo-subtask-task-filters-ui',
    taskFormValidation: 'demo-subtask-task-form-validation',
    telemetrySchema: 'demo-subtask-telemetry-schema',
    uxRequirements: 'demo-subtask-ux-requirements',
    uxWireframe: 'demo-subtask-ux-wireframe',
  },
  tags: {
    analytics: 'demo-tag-analytics',
    backend: 'demo-tag-backend',
    frontend: 'demo-tag-frontend',
    qa: 'demo-tag-qa',
    ux: 'demo-tag-ux',
    workflow: 'demo-tag-workflow',
  },
  tasks: {
    analyticsDashboard: 'demo-task-analytics-dashboard',
    kanbanWorkflow: 'demo-task-kanban-workflow',
    releaseValidation: 'demo-task-release-validation',
    rolesPermissions: 'demo-task-roles-permissions',
    searchFilters: 'demo-task-search-filters',
    uxFoundations: 'demo-task-ux-foundations',
  },
} as const

const normalizeReferenceDate = (referenceDate: Date): Date =>
  new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate()))

const addDays = (date: Date, days: number): Date => {
  const nextDate = new Date(date)
  nextDate.setUTCDate(nextDate.getUTCDate() + days)
  return nextDate
}

const toDateString = (date: Date): string => date.toISOString().slice(0, 10)

const createMembers = (): Member[] => [
  {
    id: DEMO_IDS.members.productLead,
    name: 'Avery Rivera',
    email: 'avery.rivera@tagsflow.local',
    role: 'Product Lead',
    avatar: 'AR',
  },
  {
    id: DEMO_IDS.members.frontendLead,
    name: 'Noah Kim',
    email: 'noah.kim@tagsflow.local',
    role: 'Frontend Engineer',
    avatar: 'NK',
  },
  {
    id: DEMO_IDS.members.qaEngineer,
    name: 'Maya Singh',
    email: 'maya.singh@tagsflow.local',
    role: 'QA Engineer',
    avatar: 'MS',
  },
  {
    id: DEMO_IDS.members.uiDesigner,
    name: 'Leo Torres',
    email: 'leo.torres@tagsflow.local',
    role: 'UI Designer',
    avatar: 'LT',
  },
]

const createTags = (): Tag[] => [
  { id: DEMO_IDS.tags.frontend, name: 'Frontend', color: '#6366f1' },
  { id: DEMO_IDS.tags.workflow, name: 'Workflow', color: '#f97316' },
  { id: DEMO_IDS.tags.qa, name: 'QA', color: '#16a34a' },
  { id: DEMO_IDS.tags.ux, name: 'UX', color: '#0ea5e9' },
  { id: DEMO_IDS.tags.backend, name: 'Backend', color: '#475569' },
  { id: DEMO_IDS.tags.analytics, name: 'Analytics', color: '#8b5cf6' },
]

const createTasks = (referenceDate: Date): Task[] => [
  {
    id: DEMO_IDS.tasks.uxFoundations,
    projectId: DEMO_IDS.project,
    title: 'Define UX and scope foundations',
    description: 'Capture baseline UX requirements and map current MVP boundaries for the first delivery milestone.',
    inScopeContent: 'Personas, main user journeys, and desktop-first flows for dashboard, projects, and tasks.',
    outOfScopeContent: 'Auth, cloud sync, billing, and cross-workspace features.',
    priority: 'high',
    status: 'backlog',
    startDate: toDateString(addDays(referenceDate, -5)),
    dueDate: toDateString(addDays(referenceDate, 4)),
    assigneeMemberId: DEMO_IDS.members.productLead,
    tagIds: [DEMO_IDS.tags.ux, DEMO_IDS.tags.workflow],
    checklist: [
      { text: 'Document MVP routes and module boundaries', completed: true },
      { text: 'Review non-goals with implementation team', completed: false },
    ],
    subtaskIds: [DEMO_IDS.subtasks.uxRequirements, DEMO_IDS.subtasks.uxWireframe],
  },
  {
    id: DEMO_IDS.tasks.searchFilters,
    projectId: DEMO_IDS.project,
    title: 'Implement global task search and filters',
    description: 'Add searchable and filterable task exploration for cross-project planning.',
    inScopeContent: 'Status, priority, assignee, tag, and text search filters in global tasks.',
    outOfScopeContent: 'Saved filters and advanced analytics exports.',
    priority: 'medium',
    status: 'todo',
    startDate: toDateString(addDays(referenceDate, 1)),
    dueDate: toDateString(addDays(referenceDate, 10)),
    assigneeMemberId: DEMO_IDS.members.frontendLead,
    tagIds: [DEMO_IDS.tags.frontend, DEMO_IDS.tags.workflow],
    checklist: [
      { text: 'Wire search input to local query state', completed: false },
      { text: 'Add status and priority selectors', completed: false },
    ],
    subtaskIds: [DEMO_IDS.subtasks.taskFiltersUi, DEMO_IDS.subtasks.taskFiltersQuery],
  },
  {
    id: DEMO_IDS.tasks.kanbanWorkflow,
    projectId: DEMO_IDS.project,
    title: 'Stabilize project Kanban workflow',
    description: 'Refine drag-and-drop movement and in-column ordering behavior for project Kanban.',
    inScopeContent: 'Task movement between approved statuses with visual feedback and optimistic updates.',
    outOfScopeContent: 'Custom columns and swimlanes.',
    priority: 'high',
    status: 'in_progress',
    startDate: toDateString(addDays(referenceDate, -1)),
    dueDate: toDateString(addDays(referenceDate, 8)),
    assigneeMemberId: DEMO_IDS.members.frontendLead,
    tagIds: [DEMO_IDS.tags.frontend, DEMO_IDS.tags.workflow, DEMO_IDS.tags.qa],
    checklist: [
      { text: 'Preserve keyboard accessibility while dragging', completed: true },
      { text: 'Verify reorder persistence after reload', completed: false },
    ],
    subtaskIds: [DEMO_IDS.subtasks.workflowDnD],
  },
  {
    id: DEMO_IDS.tasks.rolesPermissions,
    projectId: DEMO_IDS.project,
    title: 'Prepare role and permission matrix',
    description: 'Draft role responsibilities for future collaboration and permission model design.',
    inScopeContent: 'Document owner, contributor, and viewer capabilities for future backend migration.',
    outOfScopeContent: 'Actual authentication and authorization implementation.',
    priority: 'urgent',
    status: 'blocked',
    startDate: toDateString(addDays(referenceDate, 2)),
    dueDate: toDateString(addDays(referenceDate, 14)),
    assigneeMemberId: DEMO_IDS.members.productLead,
    tagIds: [DEMO_IDS.tags.backend],
    checklist: [
      { text: 'Collect stakeholder input for permission constraints', completed: false },
      { text: 'Map permissions to existing UI screens', completed: false },
    ],
    subtaskIds: [DEMO_IDS.subtasks.telemetrySchema],
  },
  {
    id: DEMO_IDS.tasks.releaseValidation,
    projectId: DEMO_IDS.project,
    title: 'Execute release validation checklist',
    description: 'Run cross-module checks for dashboard, tasks, Kanban, and settings before milestone close.',
    inScopeContent: 'Regression pass across local storage workflows and key UI interactions.',
    outOfScopeContent: 'Automated end-to-end pipeline setup.',
    priority: 'medium',
    status: 'review',
    startDate: toDateString(addDays(referenceDate, -2)),
    dueDate: toDateString(addDays(referenceDate, 6)),
    assigneeMemberId: DEMO_IDS.members.qaEngineer,
    tagIds: [DEMO_IDS.tags.qa, DEMO_IDS.tags.analytics],
    checklist: [
      { text: 'Confirm dashboard metrics after task edits', completed: true },
      { text: 'Confirm settings backup import validation errors', completed: false },
    ],
    subtaskIds: [DEMO_IDS.subtasks.taskFormValidation],
  },
  {
    id: DEMO_IDS.tasks.analyticsDashboard,
    projectId: DEMO_IDS.project,
    title: 'Ship baseline dashboard metrics',
    description: 'Deliver summary cards and status distribution visuals for product progress visibility.',
    inScopeContent: 'Project status counts, task summaries, and charted distributions.',
    outOfScopeContent: 'Cross-workspace reporting and historical trend analysis.',
    priority: 'low',
    status: 'done',
    startDate: toDateString(addDays(referenceDate, -14)),
    dueDate: toDateString(addDays(referenceDate, -3)),
    assigneeMemberId: DEMO_IDS.members.uiDesigner,
    tagIds: [DEMO_IDS.tags.analytics, DEMO_IDS.tags.ux],
    checklist: [
      { text: 'Confirm chart labels for all task statuses', completed: true },
      { text: 'Tune card spacing for mobile viewport', completed: true },
    ],
    subtaskIds: [],
  },
]

const createSubtasks = (referenceDate: Date): Subtask[] => [
  {
    id: DEMO_IDS.subtasks.uxRequirements,
    taskId: DEMO_IDS.tasks.uxFoundations,
    title: 'Gather UX requirements from stakeholders',
    description: 'Collect and prioritize route-level UX expectations for MVP workflows.',
    inScopeContent: 'Interview notes and consolidated requirement list.',
    outOfScopeContent: 'Fidelity prototypes.',
    priority: 'high',
    status: 'done',
    startDate: toDateString(addDays(referenceDate, -6)),
    dueDate: toDateString(addDays(referenceDate, -3)),
    assigneeMemberId: DEMO_IDS.members.productLead,
    tagIds: [DEMO_IDS.tags.ux],
    checklist: [
      { text: 'Document dashboard pain points', completed: true },
      { text: 'Document project-detail pain points', completed: true },
    ],
  },
  {
    id: DEMO_IDS.subtasks.uxWireframe,
    taskId: DEMO_IDS.tasks.uxFoundations,
    title: 'Sketch first-pass wireframes',
    description: 'Produce low-fidelity layout options for shell and module pages.',
    inScopeContent: 'Sidebar, project list, and task detail wireframes.',
    outOfScopeContent: 'Production-ready UI kits.',
    priority: 'medium',
    status: 'todo',
    startDate: toDateString(addDays(referenceDate, 0)),
    dueDate: toDateString(addDays(referenceDate, 3)),
    assigneeMemberId: DEMO_IDS.members.uiDesigner,
    tagIds: [DEMO_IDS.tags.ux],
    checklist: [{ text: 'Include desktop and mobile breakpoints', completed: false }],
  },
  {
    id: DEMO_IDS.subtasks.taskFiltersUi,
    taskId: DEMO_IDS.tasks.searchFilters,
    title: 'Design filter controls',
    description: 'Add status/priority filter controls aligned with existing shell components.',
    inScopeContent: 'Toolbar controls and responsive collapse behavior.',
    outOfScopeContent: 'Saved filter presets.',
    priority: 'medium',
    status: 'todo',
    startDate: toDateString(addDays(referenceDate, 1)),
    dueDate: toDateString(addDays(referenceDate, 5)),
    assigneeMemberId: DEMO_IDS.members.uiDesigner,
    tagIds: [DEMO_IDS.tags.frontend, DEMO_IDS.tags.ux],
    checklist: [{ text: 'Support keyboard focus states', completed: false }],
  },
  {
    id: DEMO_IDS.subtasks.taskFiltersQuery,
    taskId: DEMO_IDS.tasks.searchFilters,
    title: 'Connect filters to query state',
    description: 'Wire local filter state to task list derivations and sorting.',
    inScopeContent: 'Filter state and memoized task matching.',
    outOfScopeContent: 'Server-side filtering.',
    priority: 'high',
    status: 'in_progress',
    startDate: toDateString(addDays(referenceDate, 2)),
    dueDate: toDateString(addDays(referenceDate, 8)),
    assigneeMemberId: DEMO_IDS.members.frontendLead,
    tagIds: [DEMO_IDS.tags.frontend, DEMO_IDS.tags.workflow],
    checklist: [
      { text: 'Memoize filtered task rows', completed: true },
      { text: 'Add unit coverage for combined filters', completed: false },
    ],
  },
  {
    id: DEMO_IDS.subtasks.workflowDnD,
    taskId: DEMO_IDS.tasks.kanbanWorkflow,
    title: 'Address drag-and-drop edge cases',
    description: 'Fix column transfer issues for rapid drag operations.',
    inScopeContent: 'Cross-column move behavior and visual placeholder consistency.',
    outOfScopeContent: 'Swimlane grouping.',
    priority: 'high',
    status: 'in_progress',
    startDate: toDateString(addDays(referenceDate, -1)),
    dueDate: toDateString(addDays(referenceDate, 4)),
    assigneeMemberId: DEMO_IDS.members.frontendLead,
    tagIds: [DEMO_IDS.tags.frontend, DEMO_IDS.tags.workflow],
    checklist: [
      { text: 'Verify drop collision strategy', completed: true },
      { text: 'Confirm card ordering persistence', completed: false },
    ],
  },
  {
    id: DEMO_IDS.subtasks.telemetrySchema,
    taskId: DEMO_IDS.tasks.rolesPermissions,
    title: 'Wait for security constraints from platform team',
    description: 'Blocked until collaboration and audit expectations are finalized.',
    inScopeContent: 'Collect dependency details for future implementation.',
    outOfScopeContent: 'Enforce permissions in current frontend-only MVP.',
    priority: 'urgent',
    status: 'blocked',
    startDate: toDateString(addDays(referenceDate, 2)),
    dueDate: toDateString(addDays(referenceDate, 12)),
    assigneeMemberId: DEMO_IDS.members.productLead,
    tagIds: [DEMO_IDS.tags.backend],
    checklist: [{ text: 'Track external dependency owner', completed: false }],
  },
  {
    id: DEMO_IDS.subtasks.taskFormValidation,
    taskId: DEMO_IDS.tasks.releaseValidation,
    title: 'Validate form and import error handling',
    description: 'Confirm required-field and import-validation messaging in functional flows.',
    inScopeContent: 'Task/subtask forms and settings import errors.',
    outOfScopeContent: 'Localization.',
    priority: 'medium',
    status: 'review',
    startDate: toDateString(addDays(referenceDate, -1)),
    dueDate: toDateString(addDays(referenceDate, 2)),
    assigneeMemberId: DEMO_IDS.members.qaEngineer,
    tagIds: [DEMO_IDS.tags.qa],
    checklist: [
      { text: 'Check malformed JSON messaging', completed: true },
      { text: 'Check unsupported-version messaging', completed: false },
    ],
  },
]

const createProject = (referenceDate: Date, members: Member[], tasks: Task[]): Project => ({
  id: DEMO_IDS.project,
  title: 'Development of a SaaS Frontend Platform',
  description:
    'Build and harden the local-first TagsFlow AI MVP experience with production-grade UX and reusable architecture.',
  objective:
    'Deliver a polished project-management workflow with reliable local persistence, clear status visibility, and safe settings operations.',
  inScopeContent:
    'Dashboard, projects, tasks, subtasks, members, tags, Kanban flows, and settings backup/import/reset operations.',
  outOfScopeContent:
    'Authentication, cloud sync, backend APIs, and multi-tenant collaboration for this MVP stage.',
  status: 'active',
  startDate: toDateString(addDays(referenceDate, -10)),
  dueDate: toDateString(addDays(referenceDate, 45)),
  memberIds: members.map((member) => member.id),
  taskIds: tasks.map((task) => task.id),
})

export interface BuildDemoLocalBackupDataInput {
  referenceDate?: Date
  settings: AppSettings
}

export const buildDemoLocalBackupData = ({
  referenceDate = new Date(),
  settings,
}: BuildDemoLocalBackupDataInput): ValidatedLocalBackupData => {
  const normalizedReferenceDate = normalizeReferenceDate(referenceDate)
  const members = createMembers()
  const tags = createTags()
  const tasks = createTasks(normalizedReferenceDate)
  const subtasks = createSubtasks(normalizedReferenceDate)
  const project = createProject(normalizedReferenceDate, members, tasks)

  return {
    version: 1,
    projects: [project],
    tasks,
    subtasks,
    members,
    tags,
    settings,
  }
}
