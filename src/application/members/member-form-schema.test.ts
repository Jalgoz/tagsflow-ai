import { describe, expect, it } from 'vitest'
import { memberFormSchema } from './member-form-schema'

describe('member form schema', () => {
  it('accepts valid data', () => {
    expect(
      memberFormSchema.parse({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        role: 'Engineer',
        avatar: 'AL',
      }),
    ).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'Engineer',
      avatar: 'AL',
    })
  })

  it('rejects missing name', () => {
    expect(
      memberFormSchema.safeParse({
        name: '',
        email: '',
        role: '',
        avatar: '',
      }).success,
    ).toBe(false)
  })

  it('accepts empty optional email', () => {
    expect(
      memberFormSchema.parse({
        name: 'Ada Lovelace',
        email: '',
        role: '',
        avatar: '',
      }),
    ).toEqual({
      name: 'Ada Lovelace',
      email: '',
      role: '',
      avatar: '',
    })
  })

  it('rejects invalid email when provided', () => {
    expect(
      memberFormSchema.safeParse({
        name: 'Ada Lovelace',
        email: 'not-an-email',
        role: '',
        avatar: '',
      }).success,
    ).toBe(false)
  })
})
