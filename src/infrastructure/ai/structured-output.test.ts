import { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { parseStructuredAIResponse, safeParseJson } from './structured-output'

describe('structured AI response helpers', () => {
  it('parses valid JSON safely', () => {
    expect(safeParseJson('{"ok":true}')).toEqual({
      success: true,
      data: { ok: true },
    })
  })

  it('returns a typed failure for malformed JSON', () => {
    expect(safeParseJson('{bad json')).toEqual({
      success: false,
      code: 'invalid_json',
      message: 'The AI response did not contain valid JSON.',
      details: [],
    })
  })

  it('returns a typed failure when parsed JSON does not satisfy the schema', () => {
    const result = parseStructuredAIResponse(z.object({ id: z.string() }), '{"id":1}')

    expect(result.success).toBe(false)
    if (result.success) {
      return
    }

    expect(result.code).toBe('invalid_schema')
    expect(result.details[0]).toContain('id')
  })

  it('returns validated data when JSON matches the schema', () => {
    const result = parseStructuredAIResponse(z.object({ id: z.string() }), '{"id":"model-1"}')

    expect(result).toEqual({
      success: true,
      data: {
        id: 'model-1',
      },
    })
  })
})
