import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { keys } from '../lib/queryKeys'
import type { Holding, Transaction } from '../types'
import { TransactionType } from '../types'

export function useHoldings(accountId: string) {
  return useQuery({
    queryKey: keys.holdings(accountId),
    queryFn: () => api.get<Holding[]>(`/accounts/${accountId}/holdings`).then((r) => r.data),
  })
}

export function useTransactions(accountId: string, securityId?: string) {
  const url = securityId
    ? `/accounts/${accountId}/transactions/${securityId}`
    : `/accounts/${accountId}/transactions`
  return useQuery({
    queryKey: keys.transactions(accountId, securityId),
    queryFn: () => api.get<Transaction[]>(url).then((r) => r.data),
  })
}

export function useAddTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      accountId: string
      securityId: string
      type: TransactionType
      tradeDate: string
      settlementDate: string
      shares: number
      pricePerShare: number
      fees: number
      exchangeRate: number
      notes?: string
    }) =>
      api
        .post<{ id: string }>(`/accounts/${data.accountId}/transactions`, data)
        .then((r) => r.data.id),
    onSuccess: (_id, vars) => {
      qc.invalidateQueries({ queryKey: keys.transactions(vars.accountId) })
      qc.invalidateQueries({ queryKey: keys.holdings(vars.accountId) })
    },
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ accountId, transactionId }: { accountId: string; transactionId: string }) =>
      api.delete(`/accounts/${accountId}/transactions/${transactionId}`),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: keys.transactions(vars.accountId) })
      qc.invalidateQueries({ queryKey: keys.holdings(vars.accountId) })
    },
  })
}
