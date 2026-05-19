export interface Portfolio {
  id: string
  name: string
  description: string | null
}

export interface Account {
  id: string
  portfolioId: string
  name: string
  type: AccountType
  institutionName: string | null
  accountNumber: string | null
}

export const AccountType = {
  Taxable: 0,
  RRSP: 1,
  TFSA: 2,
  RESP: 3,
  RRIF: 4,
  FHSA: 5,
} as const
export type AccountType = (typeof AccountType)[keyof typeof AccountType]

export interface Security {
  id: string
  ticker: string
  name: string
  exchange: string
  currency: string
  type: SecurityType
}

export const SecurityType = {
  Stock: 0,
  ETF: 1,
  MutualFund: 2,
  Bond: 3,
  Option: 4,
  Crypto: 5,
  Other: 6,
} as const
export type SecurityType = (typeof SecurityType)[keyof typeof SecurityType]

export interface Holding {
  securityId: string
  ticker?: string
  name?: string
  totalShares: number
  totalBookValueCAD: number
  acbPerShare: number
}

export interface Transaction {
  id: string
  securityId: string
  ticker?: string
  type: TransactionType
  tradeDate: string
  settlementDate: string
  shares: number
  pricePerShare: number
  fees: number
  exchangeRate: number
  bookValueCAD: number
  notes: string | null
  acbPerShareAfter: number
  totalSharesAfter: number
  realizedGainLossCAD: number | null
}

export const TransactionType = {
  Buy: 0,
  Sell: 1,
  DividendReinvestment: 2,
  ReturnOfCapital: 3,
  StockSplit: 4,
  StockConsolidation: 5,
  Transfer: 6,
  SuperficialLossAdjustment: 7,
} as const
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType]

export interface ExchangeRate {
  from: string
  to: string
  date: string
  rate: number
}
