import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createEmptyProjectFormValues,
  createProjectInputFromFormValues,
  projectToFormValues,
  updateProjectInputFromFormValues,
  type ProjectFormInput,
} from '../../application'
import { useCreateProject, useProjects, useUpdateProject } from '../../application'
import { ProjectForm } from '../components/ProjectForm'
import { useToast } from '../feedback'
import { APP_ROUTE_PATHS } from '../../shared/constants/routes'

type ProjectEditorState =
  | {
      mode: 'create'
    }
  | {
      mode: 'edit'
      projectId: string
    }
  | null

const formatDate = (value: string | null): string => {
  if (value === null || value.trim() === '') {
    return 'Not set'
  }

  return value
}

const projectSummary = (project: { description: string; objective: string }): string => {
  return project.description.trim() !== '' ? project.description : project.objective || 'No summary provided'
}

export const ProjectsPage = () => {
  const { data: projects = [], error, isError, isLoading } = useProjects()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const toast = useToast()
  const [editorState, setEditorState] = useState<ProjectEditorState>(null)

  const activeProject = useMemo(() => {
    if (editorState?.mode !== 'edit') {
      return null
    }

    return projects.find((project) => project.id === editorState.projectId) ?? null
  }, [editorState, projects])

  const visibleProjects =
    editorState?.mode === 'edit' && activeProject !== null
      ? projects.filter((project) => project.id !== activeProject.id)
      : projects

  const openCreateEditor = () => {
    setEditorState({ mode: 'create' })
  }

  const openEditEditor = (projectId: string) => {
    setEditorState({ mode: 'edit', projectId })
  }

  const closeEditor = () => {
    setEditorState(null)
  }

  const editorInitialValues: ProjectFormInput =
    editorState?.mode === 'edit' && activeProject !== null ? projectToFormValues(activeProject) : createEmptyProjectFormValues()

  return (
    <section className="project-workspace">
      <div className="project-workspace__header">
        <div>
          <p className="project-workspace__eyebrow">Projects</p>
          <h2 className="project-workspace__title">Project management</h2>
          <p className="project-workspace__description">
            Create, review, and maintain the project records that drive project detail and future task workflows.
          </p>
        </div>
        <button className="project-workspace__action" type="button" onClick={openCreateEditor}>
          New project
        </button>
      </div>

      {editorState !== null ? (
        <div className="project-workspace__panel">
          <ProjectForm
            cancelLabel="Cancel"
            description={
              editorState.mode === 'create'
                ? 'Start a new project record.'
                : 'Update the selected project record.'
            }
            initialValues={editorInitialValues}
            isSubmitting={createProject.isPending || updateProject.isPending}
            onCancel={closeEditor}
            onSubmit={async (values) => {
              if (editorState.mode === 'create') {
                await createProject.mutateAsync(createProjectInputFromFormValues(values))
                toast.success('Project created.')
                closeEditor()
                return
              }

              await updateProject.mutateAsync({
                input: updateProjectInputFromFormValues(values),
                projectId: editorState.projectId,
              })
              toast.success('Project updated.')
              closeEditor()
            }}
            submitLabel={editorState.mode === 'create' ? 'Create project' : 'Save changes'}
            title={editorState.mode === 'create' ? 'Create project' : 'Edit project'}
          />
        </div>
      ) : null}

      {isLoading ? <div className="project-state">Loading projects...</div> : null}

      {isError ? (
        <div className="project-state project-state--error">
          Unable to load projects.
          <span>{error instanceof Error ? error.message : 'Unknown error'}</span>
        </div>
      ) : null}

      {!isLoading && !isError && projects.length === 0 ? (
        <div className="project-empty-state">
          <div>
            <p className="project-empty-state__eyebrow">No projects yet</p>
            <h3 className="project-empty-state__title">Create the first project record</h3>
            <p className="project-empty-state__description">
              The project module is ready for local project records, detail views, and later task planning.
            </p>
          </div>
          <button className="project-workspace__action" type="button" onClick={openCreateEditor}>
            New project
          </button>
        </div>
      ) : null}

      {!isLoading && !isError && visibleProjects.length > 0 ? (
        <div className="project-list">
          {visibleProjects.map((project) => (
            <article key={project.id} className="project-list__item">
              <div className="project-list__meta">
                <div className="project-list__title-row">
                  <h3 className="project-list__title project-list__title--bold">{project.title}</h3>
                  <span className={`project-status project-status--${project.status}`}>{project.status}</span>
                </div>
                <p className="project-list__summary">{projectSummary(project)}</p>

                <dl className="project-list__details">
                  <div>
                    <dt>Objective</dt>
                    <dd>{project.objective || 'Not set'}</dd>
                  </div>
                  <div>
                    <dt>Start</dt>
                    <dd>{formatDate(project.startDate)}</dd>
                  </div>
                  <div>
                    <dt>Due</dt>
                    <dd>{formatDate(project.dueDate)}</dd>
                  </div>
                </dl>
              </div>

              <div className="project-list__actions">
                <Link className="project-list__button" to={`${APP_ROUTE_PATHS.projects}/${project.id}`}>
                  Open
                </Link>
                <button className="project-list__button project-list__button--secondary" type="button" onClick={() => openEditEditor(project.id)}>
                  Edit
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
