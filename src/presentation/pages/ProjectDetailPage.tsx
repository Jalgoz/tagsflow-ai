import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  projectToFormValues,
  updateProjectInputFromFormValues,
  type ProjectFormInput,
} from '../../application'
import { useDeleteProject, useProject, useUpdateProject } from '../../application'
import { ProjectForm } from '../components/ProjectForm'
import { SectionPlaceholder } from '../components/SectionPlaceholder'
import { ConfirmDialog, useToast } from '../feedback'
import { APP_ROUTE_PATHS } from '../../shared/constants/routes'

type ProjectTab = 'overview' | 'tasks' | 'kanban' | 'ai-insights'

const tabLabels: Record<ProjectTab, string> = {
  overview: 'Overview',
  tasks: 'Tasks',
  kanban: 'Kanban',
  'ai-insights': 'AI Insights',
}

const formatDate = (value: string | null): string => {
  if (value === null || value.trim() === '') {
    return 'Not set'
  }

  return value
}

const tabOrder: ProjectTab[] = ['overview', 'tasks', 'kanban', 'ai-insights']

export const ProjectDetailPage = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { data: projectData, error, isError, isLoading } = useProject(projectId)
  const deleteProject = useDeleteProject()
  const updateProject = useUpdateProject()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<ProjectTab>('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
  const project = projectData ?? null

  const projectFormValues: ProjectFormInput | null = useMemo(() => {
    if (project === null) {
      return null
    }

    return projectToFormValues(project)
  }, [project])

  const handleDelete = async () => {
    if (project === null) {
      return
    }

    await deleteProject.mutateAsync(project.id)
    toast.success('Project deleted.')
    setDeleteConfirmationOpen(false)
    navigate(APP_ROUTE_PATHS.projects, { replace: true })
  }

  const openEdit = () => {
    setDeleteConfirmationOpen(false)
    setIsEditing(true)
  }

  const openDeleteConfirmation = () => {
    setIsEditing(false)
    setDeleteConfirmationOpen(true)
  }

  const closeDeleteConfirmation = () => {
    setDeleteConfirmationOpen(false)
  }

  if (isLoading) {
    return <div className="project-state">Loading project...</div>
  }

  if (isError) {
    return (
      <div className="project-state project-state--error">
        Unable to load project.
        <span>{error instanceof Error ? error.message : 'Unknown error'}</span>
      </div>
    )
  }

  if (project === null) {
    return (
      <section className="project-detail">
        <div className="project-detail__not-found">
          <p className="project-workspace__eyebrow">Project detail</p>
          <h2 className="project-workspace__title">Project not found</h2>
          <p className="project-workspace__description">
            The requested project record is not available in local storage.
          </p>
          <Link className="project-list__button" to={APP_ROUTE_PATHS.projects}>
            Back to Projects
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="project-detail">
      <div className="project-detail__header">
        <div>
          <p className="project-workspace__eyebrow">Project detail</p>
          <h2 className="project-workspace__title">{project.title}</h2>
          <p className="project-workspace__description">{project.description || 'No description provided.'}</p>
        </div>
        <div className="project-detail__actions">
          <Link className="project-list__button project-list__button--secondary" to={APP_ROUTE_PATHS.projects}>
            Back
          </Link>
          <button className="project-list__button project-list__button--secondary" type="button" onClick={openEdit}>
            Edit
          </button>
          <button
            className="project-list__button project-list__button--danger"
            disabled={deleteProject.isPending}
            type="button"
            onClick={openDeleteConfirmation}
          >
            Delete
          </button>
        </div>
      </div>

      <ConfirmDialog
        cancelLabel="Keep project"
        confirmLabel="Delete project"
        description="This removes the project record and repository-managed dependent records."
        isOpen={deleteConfirmationOpen}
        isPending={deleteProject.isPending}
        onCancel={closeDeleteConfirmation}
        onConfirm={handleDelete}
        pendingLabel="Deleting project..."
        title="Delete this project?"
      />

      <div className="project-tabs" role="tablist" aria-label="Project detail tabs">
        {tabOrder.map((tab) => (
          <button
            key={tab}
            aria-selected={activeTab === tab}
            className={`project-tabs__tab ${activeTab === tab ? 'project-tabs__tab--active' : ''}`}
            role="tab"
            type="button"
            onClick={() => setActiveTab(tab)}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {isEditing && projectFormValues !== null ? (
        <div className="project-detail__panel">
          <ProjectForm
            cancelLabel="Cancel"
            description="Update project details and keep the overview in sync."
            initialValues={projectFormValues}
            isSubmitting={updateProject.isPending}
            onCancel={() => setIsEditing(false)}
            onSubmit={async (values) => {
              await updateProject.mutateAsync({
                input: updateProjectInputFromFormValues(values),
                projectId: project.id,
              })
              toast.success('Project updated.')
              setIsEditing(false)
            }}
            submitLabel="Save changes"
            title="Edit project"
          />
        </div>
      ) : null}

      {activeTab === 'overview' ? (
        <div className="project-overview">
          <div className="project-overview__card">
            <dl className="project-overview__grid">
              <div>
                <dt>Status</dt>
                <dd>
                  <span className={`project-status project-status--${project.status}`}>{project.status}</span>
                </dd>
              </div>
              <div>
                <dt>Start date</dt>
                <dd>{formatDate(project.startDate)}</dd>
              </div>
              <div>
                <dt>Due date</dt>
                <dd>{formatDate(project.dueDate)}</dd>
              </div>
              <div>
                <dt>Members</dt>
                <dd>{project.memberIds.length}</dd>
              </div>
              <div>
                <dt>Tasks</dt>
                <dd>{project.taskIds.length}</dd>
              </div>
              <div>
                <dt>Progress</dt>
                <dd>0%</dd>
              </div>
            </dl>
          </div>

          <div className="project-overview__card project-overview__card--stacked">
            <div>
              <p className="project-overview__label">Objective</p>
              <p className="project-overview__text">{project.objective || 'Not set.'}</p>
            </div>
            <div>
              <p className="project-overview__label">In scope</p>
              <p className="project-overview__text">{project.inScopeContent || 'Not set.'}</p>
            </div>
            <div>
              <p className="project-overview__label">Out of scope</p>
              <p className="project-overview__text">{project.outOfScopeContent || 'Not set.'}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="project-detail__panel">
          <SectionPlaceholder
            description={`The ${tabLabels[activeTab].toLowerCase()} tab is reserved for a later implementation slice.`}
            subtitle={tabLabels[activeTab]}
            title={`${tabLabels[activeTab]} placeholder`}
          />
        </div>
      )}
    </section>
  )
}
