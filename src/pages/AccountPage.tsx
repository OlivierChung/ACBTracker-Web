import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useHoldings, useTransactions, useDeleteTransaction, useAddTransaction } from '../hooks/useTransactions'
import { useExchangeRate } from '../hooks/useExchangeRate'
import { TransactionType } from '../types'
import { useForm, useWatch } from 'react-hook-form'
import { api } from '../lib/api'
import type { Security } from '../types'

const TX_TYPE_LABELS: Record<TransactionType, string> = {
  [TransactionType.Buy]: 'Buy',
  [TransactionType.Sell]: 'Sell',
  [TransactionType.DividendReinvestment]: 'DRIP',
  [TransactionType.ReturnOfCapital]: 'Return of Capital',
  [TransactionType.StockSplit]: 'Stock Split',
  [TransactionType.StockConsolidation]: 'Stock Consolidation',
  [TransactionType.Transfer]: 'Transfer',
  [TransactionType.SuperficialLossAdjustment]: 'Superficial Loss Adj.',
}

const CAD = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })
const NUM = new Intl.NumberFormat('en-CA', { maximumFractionDigits: 4 })

interface TxFormValues {
  securitySearch: string
  securityId: string
  type: string
  tradeDate: string
  settlementDate: string
  shares: string
  pricePerShare: string
  fees: string
  exchangeRate: string
  notes: string
}

export function AccountPage() {
  const { portfolioId, accountId } = useParams<{ portfolioId: string; accountId: string }>()
  const { data: holdings, isLoading: holdingsLoading } = useHoldings(accountId!)
  const { data: transactions, isLoading: txLoading } = useTransactions(accountId!)
  const deleteTransaction = useDeleteTransaction()
  const addTransaction = useAddTransaction()

  const [showForm, setShowForm] = useState(false)
  const [securityResults, setSecurityResults] = useState<Security[]>([])
  const [selectedSecurity, setSelectedSecurity] = useState<Security | null>(null)

  const { register, handleSubmit, setValue, control, reset } = useForm<TxFormValues>({
    defaultValues: { exchangeRate: '1', type: '0' },
  })

  const tradeDate = useWatch({ control, name: 'tradeDate' })
  const currency = selectedSecurity?.currency ?? 'CAD'
  const { data: fx } = useExchangeRate(currency, tradeDate, !!tradeDate && currency !== 'CAD')

  // Auto-fill exchange rate when fx loads
  if (fx && currency !== 'CAD') setValue('exchangeRate', String(fx.rate))

  async function searchSecurities(q: string) {
    if (!q) return setSecurityResults([])
    const { data } = await api.get<Security[]>('/securities', { params: { q } })
    setSecurityResults(data)
  }

  function selectSecurity(s: Security) {
    setSelectedSecurity(s)
    setValue('securityId', s.id)
    setValue('securitySearch', `${s.ticker} — ${s.name}`)
    if (s.currency === 'CAD') setValue('exchangeRate', '1')
    setSecurityResults([])
  }

  async function onSubmit(values: TxFormValues) {
    await addTransaction.mutateAsync({
      accountId: accountId!,
      securityId: values.securityId,
      type: Number(values.type) as TransactionType,
      tradeDate: values.tradeDate,
      settlementDate: values.settlementDate,
      shares: Number(values.shares),
      pricePerShare: Number(values.pricePerShare),
      fees: Number(values.fees) || 0,
      exchangeRate: Number(values.exchangeRate),
      notes: values.notes || undefined,
    })
    reset({ exchangeRate: '1', type: '0' })
    setSelectedSecurity(null)
    setShowForm(false)
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-gray-900">Portfolios</Link>
        <span>/</span>
        <Link to={`/portfolios/${portfolioId}`} className="hover:text-gray-900">Portfolio</Link>
        <span>/</span>
        <span className="text-gray-900">Account</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Holdings</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 cursor-pointer"
        >
          Add transaction
        </button>
      </div>

      {/* Holdings table */}
      {holdingsLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg mb-8 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Security</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Shares</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ACB / share</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Total book value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {holdings?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                    No holdings yet.
                  </td>
                </tr>
              )}
              {holdings?.map((h) => (
                <tr key={h.securityId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{h.ticker ?? h.securityId}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{NUM.format(h.totalShares)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{CAD.format(h.acbPerShare)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{CAD.format(h.totalBookValueCAD)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add transaction form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">New transaction</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-3 gap-4">
            <div className="col-span-3 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Security</label>
              <input
                {...register('securitySearch')}
                placeholder="Search by ticker or name…"
                onChange={(e) => searchSecurities(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input {...register('securityId')} type="hidden" />
              {securityResults.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                  {securityResults.map((s) => (
                    <li
                      key={s.id}
                      onClick={() => selectSecurity(s)}
                      className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                    >
                      <span className="font-medium">{s.ticker}</span>
                      <span className="text-gray-500 ml-2">{s.name}</span>
                      <span className="text-gray-400 ml-2 text-xs">{s.currency}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                {...register('type')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(TX_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trade date</label>
              <input
                {...register('tradeDate', { required: true })}
                type="date"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Settlement date</label>
              <input
                {...register('settlementDate', { required: true })}
                type="date"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shares</label>
              <input
                {...register('shares', { required: true })}
                type="number"
                step="any"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price / share ({currency})
              </label>
              <input
                {...register('pricePerShare', { required: true })}
                type="number"
                step="any"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fees ({currency})</label>
              <input
                {...register('fees')}
                type="number"
                step="any"
                defaultValue="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exchange rate ({currency} → CAD)
                {fx && currency !== 'CAD' && (
                  <span className="text-green-600 text-xs ml-2">
                    BoC {fx.date}: {fx.rate}
                  </span>
                )}
              </label>
              <input
                {...register('exchangeRate', { required: true })}
                type="number"
                step="any"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <input
                {...register('notes')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={addTransaction.isPending}
                className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                {addTransaction.isPending ? 'Saving…' : 'Save transaction'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transactions table */}
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Transactions</h2>
      {txLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Shares</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Price</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Book value</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">ACB / share</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Gain / Loss</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions?.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                    No transactions yet.
                  </td>
                </tr>
              )}
              {transactions?.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{t.tradeDate}</td>
                  <td className="px-4 py-3 text-gray-700">{TX_TYPE_LABELS[t.type]}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{NUM.format(t.shares)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{NUM.format(t.pricePerShare)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{CAD.format(t.bookValueCAD)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{CAD.format(t.acbPerShareAfter)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${t.realizedGainLossCAD !== null && t.realizedGainLossCAD !== 0 ? (t.realizedGainLossCAD > 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                    {t.realizedGainLossCAD !== null ? CAD.format(t.realizedGainLossCAD) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteTransaction.mutate({ accountId: accountId!, transactionId: t.id })}
                      className="text-red-500 hover:text-red-700 text-xs cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
