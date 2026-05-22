import type { Tag } from '../../domain'

type TagBadgeProps = {
  tag: Tag
}

export const TagBadge = ({ tag }: TagBadgeProps) => {
  const swatchColor = tag.color ?? 'var(--accent)'

  return (
    <span className="tag-badge">
      <span className="tag-badge__swatch" style={{ backgroundColor: swatchColor }} />
      <span className="tag-badge__label">{tag.name}</span>
    </span>
  )
}
