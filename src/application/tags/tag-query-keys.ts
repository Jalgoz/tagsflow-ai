export const tagQueryKeys = {
  all: ['tags'] as const,
  list: () => [...tagQueryKeys.all, 'list'] as const,
  detail: (tagId: string) => [...tagQueryKeys.all, 'detail', tagId] as const,
} as const
