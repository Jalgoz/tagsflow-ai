import { describe, expect, it } from 'vitest'
import { tagFormSchema } from './tag-form-schema'

describe('tag form schema', () => {
  it('accepts valid data', () => {
    expect(
      tagFormSchema.parse({
        name: 'Frontend',
        color: '#6366f1',
      }),
    ).toEqual({
      name: 'Frontend',
      color: '#6366f1',
    })
  })

  it('rejects missing name', () => {
    expect(
      tagFormSchema.safeParse({
        name: '',
        color: '',
      }).success,
    ).toBe(false)
  })

  it('accepts omitted color', () => {
    expect(
      tagFormSchema.parse({
        name: 'Frontend',
        color: '',
      }),
    ).toEqual({
      name: 'Frontend',
      color: '',
    })
  })
})
