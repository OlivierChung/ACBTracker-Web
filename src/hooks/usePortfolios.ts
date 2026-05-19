import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { keys } from '../lib/queryKeys'
import type { Portfolio } from '../types'

export function usePortfolios() {
  return useQuery({
    queryKey: keys.portfolios,
    queryFn: () => api.get<Portfolio[]>('/portfolios/').then((r) => r.data),
  })
}

export function usePortfolio(id: string) {
  return useQuery({
    queryKey: keys.portfolio(id),
    queryFn: () => api.get<Portfolio>(`/portfolios/${id}`).then((r) => r.data),
  })
}

export function useCreatePortfolio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.post<{ id: string }>('/portfolios/', data).then((r) => r.data.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.portfolios }),
  })
}

export function useDeletePortfolio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/portfolios/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.portfolios }),
  })
}
