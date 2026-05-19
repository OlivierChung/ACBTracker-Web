import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { keys } from '../lib/queryKeys'
import type { Account } from '../types'
import { AccountType } from '../types'

export function useAccount(portfolioId: string, accountId: string) {
  return useQuery({
    queryKey: keys.account(accountId),
    queryFn: () =>
      api.get<Account>(`/portfolios/${portfolioId}/accounts/${accountId}`).then((r) => r.data),
  })
}

export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      portfolioId: string
      name: string
      type: AccountType
      institutionName?: string
      accountNumber?: string
    }) =>
      api
        .post<{ id: string }>(`/portfolios/${data.portfolioId}/accounts/`, data)
        .then((r) => r.data.id),
    onSuccess: (_id, vars) =>
      qc.invalidateQueries({ queryKey: keys.accounts(vars.portfolioId) }),
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ portfolioId, accountId }: { portfolioId: string; accountId: string }) =>
      api.delete(`/portfolios/${portfolioId}/accounts/${accountId}`),
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: keys.accounts(vars.portfolioId) }),
  })
}
