import { z } from 'zod'

export type StructuredAIResponseFailureCode = 'invalid_json' | 'invalid_schema'

export type StructuredAIResponseSuccess<TData> = {
  success: true
  data: TData
}

export type StructuredAIResponseFailure = {
  success: false
  code: StructuredAIResponseFailureCode
  details: string[]
  message: string
}

export type StructuredAIResponseResult<TData> = StructuredAIResponseSuccess<TData> | StructuredAIResponseFailure

const formatIssue = (issue: z.core.$ZodIssue): string => {
  const path = issue.path?.join('.') ?? ''

  if (path.length === 0) {
    return issue.message
  }

  return `${path}: ${issue.message}`
}

export const safeParseJson = (jsonText: string): StructuredAIResponseResult<unknown> => {
  try {
    return {
      success: true,
      data: JSON.parse(jsonText) as unknown,
    }
  } catch {
    return {
      success: false,
      code: 'invalid_json',
      message: 'The AI response did not contain valid JSON.',
      details: [],
    }
  }
}

export const parseStructuredAIResponse = <TSchema extends z.ZodType>(
  schema: TSchema,
  jsonText: string,
): StructuredAIResponseResult<z.infer<TSchema>> => {
  const parsedJsonResult = safeParseJson(jsonText)

  if (!parsedJsonResult.success) {
    return parsedJsonResult
  }

  const validationResult = schema.safeParse(parsedJsonResult.data)

  if (!validationResult.success) {
    return {
      success: false,
      code: 'invalid_schema',
      message: 'The AI response JSON did not match the expected schema.',
      details: validationResult.error.issues.map(formatIssue),
    }
  }

  return {
    success: true,
    data: validationResult.data,
  }
}
