import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { keys } from '../lib/queryKeys'
import type { Security, SecurityType } from '../types'

export function useSecurities() {
  return useQuery({
    queryKey: keys.securitiesList,
    queryFn: () => api.get<Security[]>('/securities').then((r) => r.data),
  })
}

export function useCreateSecurity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      ticker: string
      name: string
      exchange: string
      currency: string
      type: SecurityType
      isin?: string
      cusip?: string
    }) => api.post<{ id: string }>('/securities', body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.securitiesList }),
  })
}

export function useUpdateSecurity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string
      name: string
      exchange: string
      type: SecurityType
    }) => api.put(`/securities/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.securitiesList }),
  })
}

export function useDeleteSecurity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/securities/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.securitiesList }),
  })
}
