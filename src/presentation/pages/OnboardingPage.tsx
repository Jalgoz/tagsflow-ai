import { useLoadDemoData, useStartEmptyOnboarding } from '../../application'
import { useToast } from '../feedback'

export const OnboardingPage = () => {
  const startEmptyMutation = useStartEmptyOnboarding()
  const loadDemoDataMutation = useLoadDemoData()
  const toast = useToast()

  const isMutating = startEmptyMutation.isPending || loadDemoDataMutation.isPending

  const handleStartEmpty = async () => {
    await startEmptyMutation.mutateAsync()
    toast.success('Workspace ready. You can start with empty local data.')
  }

  const handleLoadDemoData = async () => {
    await loadDemoDataMutation.mutateAsync()
    toast.success('Demo workspace loaded successfully.')
  }

  return (
    <section className="project-workspace onboarding-page">
      <article className="project-workspace__panel onboarding-page__panel">
        <p className="project-workspace__eyebrow">Welcome to TagsFlow AI</p>
        <h2 className="project-workspace__title">Choose how to start this local workspace</h2>
        <p className="project-workspace__description">
          Start with an empty workspace or load editable demo data for "Development of a SaaS Frontend Platform".
        </p>
        <div className="onboarding-page__actions">
          <button
            className="project-workspace__action project-workspace__action--secondary"
            disabled={isMutating}
            type="button"
            onClick={() => void handleStartEmpty()}
          >
            {startEmptyMutation.isPending ? 'Starting...' : 'Start empty'}
          </button>
          <button
            className="project-workspace__action"
            disabled={isMutating}
            type="button"
            onClick={() => void handleLoadDemoData()}
          >
            {loadDemoDataMutation.isPending ? 'Loading demo data...' : 'Load demo data'}
          </button>
        </div>
        <p className="onboarding-page__footnote">
          Demo records are normal local records: editable, deletable, exportable, and resettable.
        </p>
      </article>
    </section>
  )
}
