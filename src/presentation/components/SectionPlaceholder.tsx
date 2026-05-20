type SectionPlaceholderProps = {
  description: string
  subtitle?: string
  title: string
}

export const SectionPlaceholder = ({ description, subtitle, title }: SectionPlaceholderProps) => {
  return (
    <section className="page-card">
      <div className="page-card__header">
        <div>
          {subtitle ? <p className="page-card__subtitle">{subtitle}</p> : null}
          <h2 className="page-card__title">{title}</h2>
        </div>
        <span className="page-card__badge">Placeholder</span>
      </div>
      <p className="page-card__description">{description}</p>
    </section>
  )
}
