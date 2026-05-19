import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { keys } from '../lib/queryKeys'
import type { ExchangeRate } from '../types'

export function useExchangeRate(from: string, date: string, enabled = true) {
  return useQuery({
    queryKey: keys.exchangeRate(from, date),
    queryFn: () =>
      api.get<ExchangeRate>('/exchange-rates', { params: { from, date } }).then((r) => r.data),
    enabled: enabled && !!from && !!date && from.toUpperCase() !== 'CAD',
    staleTime: Infinity, // historical rates never change
  })
}
