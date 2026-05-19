import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  useCreatePortfolio,
  useDeletePortfolio,
  usePortfolioDashboard,
  usePortfolios,
  useSetDefaultPortfolio,
} from '../hooks/usePortfolios'
import { TransactionType } from '../types'

const txTypeLabel: Record<number, string> = {
  [TransactionType.Buy]: 'Buy',
  [TransactionType.Sell]: 'Sell',
  [TransactionType.DividendReinvestment]: 'DRIP',
  [TransactionType.ReturnOfCapital]: 'RoC',
  [TransactionType.StockSplit]: 'Split',
  [TransactionType.StockConsolidation]: 'Consolidation',
  [TransactionType.Transfer]: 'Transfer',
  [TransactionType.SuperficialLossAdjustment]: 'SLA',
}

export function PortfoliosPage() {
  const { data: portfolios, isLoading } = usePortfolios()
  const createPortfolio = useCreatePortfolio()
  const deletePortfolio = useDeletePortfolio()
  const setDefault = useSetDefaultPortfolio()
  const [showForm, setShowForm] = useState(false)
  const { register, handleSubmit, reset } = useForm<{ name: string; description: string }>()

  const defaultPortfolio = portfolios?.find((p) => p.isDefault)
  const { data: dashboard } = usePortfolioDashboard(defaultPortfolio?.id)

  async function onCreate(values: { name: string; description: string }) {
    await createPortfolio.mutateAsync({ name: values.name, description: values.description })
    reset()
    setShowForm(false)
  }

  if (isLoading) return <p className="text-gray-500">Loading…</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Portfolios</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 cursor-pointer"
        >
          New portfolio
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onCreate)}
          className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex gap-3 items-end"
        >
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              {...register('name', { required: true })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <input
              {...register('description')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 cursor-pointer"
          >
            Create
          </button>
        </form>
      )}

      {portfolios?.length === 0 && (
        <p className="text-gray-500 text-sm">No portfolios yet. Create one to get started.</p>
      )}

      <div className="grid gap-3">
        {portfolios?.map((p) => (
          <div
            key={p.id}
            className={`bg-white border rounded-lg p-4 flex items-center justify-between ${p.isDefault ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}
          >
            <div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/portfolios/${p.id}`}
                  className="font-medium text-gray-900 hover:text-blue-600"
                >
                  {p.name}
                </Link>
                {p.isDefault && (
                  <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5">
                    Default
                  </span>
                )}
              </div>
              {p.description && <p className="text-sm text-gray-500 mt-0.5">{p.description}</p>}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDefault.mutate(p.id)}
                disabled={setDefault.isPending}
                className={`text-xs cursor-pointer disabled:opacity-50 ${p.isDefault ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400 hover:text-blue-600'}`}
              >
                {p.isDefault ? 'Remove default' : 'Set as default'}
              </button>
              <button
                onClick={() => { if (confirm(`Delete portfolio "${p.name}"? This cannot be undone.`)) deletePortfolio.mutate(p.id) }}
                className="text-sm text-red-500 hover:text-red-700 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {dashboard && (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Holdings — {dashboard.portfolioName}
            </h2>
            {dashboard.holdings.length === 0 ? (
              <p className="text-sm text-gray-500">No holdings yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-2 text-left">Ticker</th>
                      <th className="px-4 py-2 text-left">Security</th>
                      <th className="px-4 py-2 text-left">Account</th>
                      <th className="px-4 py-2 text-right">Shares</th>
                      <th className="px-4 py-2 text-right">ACB/share</th>
                      <th className="px-4 py-2 text-right">Book value (CAD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dashboard.holdings.map((h) => (
                      <tr key={`${h.accountId}-${h.securityId}`} className="bg-white hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{h.ticker}</td>
                        <td className="px-4 py-2 text-gray-700">{h.securityName}</td>
                        <td className="px-4 py-2 text-gray-500">{h.accountName}</td>
                        <td className="px-4 py-2 text-right">{h.totalShares}</td>
                        <td className="px-4 py-2 text-right">${h.acbPerShare.toFixed(4)}</td>
                        <td className="px-4 py-2 text-right">${h.totalBookValueCAD.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent transactions</h2>
            {dashboard.recentTransactions.length === 0 ? (
              <p className="text-sm text-gray-500">No transactions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Ticker</th>
                      <th className="px-4 py-2 text-left">Account</th>
                      <th className="px-4 py-2 text-right">Shares</th>
                      <th className="px-4 py-2 text-right">Price</th>
                      <th className="px-4 py-2 text-right">Book val (CAD)</th>
                      <th className="px-4 py-2 text-right">Realized G/L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dashboard.recentTransactions.map((t) => (
                      <tr key={t.id} className="bg-white hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-500">{t.tradeDate.slice(0, 10)}</td>
                        <td className="px-4 py-2">
                          <span className="text-xs bg-gray-100 text-gray-700 rounded px-1.5 py-0.5">
                            {txTypeLabel[t.type] ?? t.type}
                          </span>
                        </td>
                        <td className="px-4 py-2 font-medium">{t.ticker}</td>
                        <td className="px-4 py-2 text-gray-500">{t.accountName}</td>
                        <td className="px-4 py-2 text-right">{t.shares}</td>
                        <td className="px-4 py-2 text-right">${t.pricePerShare.toFixed(4)}</td>
                        <td className="px-4 py-2 text-right">${t.bookValueCAD.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">
                          {t.realizedGainLossCAD != null ? (
                            <span className={t.realizedGainLossCAD >= 0 ? 'text-green-600' : 'text-red-600'}>
                              ${t.realizedGainLossCAD.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
