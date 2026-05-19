export const keys = {
  portfolios: ['portfolios'] as const,
  portfolio: (id: string) => ['portfolios', id] as const,
  accounts: (portfolioId: string) => ['portfolios', portfolioId, 'accounts'] as const,
  account: (id: string) => ['accounts', id] as const,
  holdings: (accountId: string) => ['accounts', accountId, 'holdings'] as const,
  transactions: (accountId: string, securityId?: string) =>
    securityId
      ? ['accounts', accountId, 'transactions', securityId]
      : ['accounts', accountId, 'transactions'],
  portfolioDashboard: (id: string) => ['portfolios', id, 'dashboard'] as const,
  securitiesList: ['securities'] as const,
  securities: (q: string) => ['securities', q] as const,
  exchangeRate: (from: string, date: string) => ['exchangeRate', from, date] as const,
}
