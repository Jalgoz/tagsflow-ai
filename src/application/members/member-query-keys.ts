export const memberQueryKeys = {
  all: ['members'] as const,
  list: () => [...memberQueryKeys.all, 'list'] as const,
  detail: (memberId: string) => [...memberQueryKeys.all, 'detail', memberId] as const,
} as const
