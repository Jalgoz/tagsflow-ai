import { useParams } from 'react-router-dom'
import { SectionPlaceholder } from '../components/SectionPlaceholder'

export const ProjectDetailPage = () => {
  const { projectId } = useParams()

  return (
    <SectionPlaceholder
      subtitle="Project detail"
      title={`Project ${projectId ?? 'unknown'}`}
      description="This route is reserved for the project detail workspace with overview, tasks, kanban, and AI insights tabs in later slices."
    />
  )
}
