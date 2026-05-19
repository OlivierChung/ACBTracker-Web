import { useState, useMemo, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useConfirm } from '../components/ConfirmDialog'
import {
  useHoldings,
  useTransactions,
  useDeleteTransaction,
  useAddTransaction,
  useUpdateTransaction,
} from '../hooks/useTransactions'
import { useExchangeRate } from '../hooks/useExchangeRate'
import { TransactionType } from '../types'
import type { Transaction } from '../types'
import { useForm, useWatch } from 'react-hook-form'
import { api } from '../lib/api'
import type { Security } from '../types'
import { nextBusinessDay } from '../lib/businessDays'

type PriceMode = 'perShare' | 'total'
type InputCurrency = 'native' | 'cad'

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
  const updateTransaction = useUpdateTransaction()

  const { confirm, dialog } = useConfirm()
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [securityResults, setSecurityResults] = useState<Security[]>([])
  const [selectedSecurity, setSelectedSecurity] = useState<Security | null>(null)
  const [priceMode, setPriceMode] = useState<PriceMode>('perShare')
  const [inputCurrency, setInputCurrency] = useState<InputCurrency>('native')

  const { register, handleSubmit, setValue, control, reset } = useForm<TxFormValues>({
    defaultValues: { exchangeRate: '1', type: '0' },
  })

  const tradeDate = useWatch({ control, name: 'tradeDate' })
  const priceInput = useWatch({ control, name: 'pricePerShare' })
  const sharesInput = useWatch({ control, name: 'shares' })
  const exchangeRateInput = useWatch({ control, name: 'exchangeRate' })
  const currency = selectedSecurity?.currency ?? 'CAD'
  const { data: fx } = useExchangeRate(currency, tradeDate, !!tradeDate && currency !== 'CAD')

  if (fx && currency !== 'CAD') setValue('exchangeRate', String(fx.rate))

  useEffect(() => {
    if (editingTransaction || !tradeDate) return
    setValue('settlementDate', nextBusinessDay(tradeDate, selectedSecurity?.exchange))
  }, [tradeDate, editingTransaction, selectedSecurity?.exchange, setValue])

  const effectivePps = useMemo(() => {
    const pps = Number(priceInput)
    const shares = Number(sharesInput)
    const exRate = Number(exchangeRateInput) || 1
    if (!pps) return null
    let result = pps
    if (priceMode === 'total') {
      if (!shares) return null
      result = result / shares
    }
    if (inputCurrency === 'cad' && currency !== 'CAD') result = result / exRate
    return result
  }, [priceInput, sharesInput, exchangeRateInput, priceMode, inputCurrency, currency])

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

  function openAddForm() {
    setEditingTransaction(null)
    setSelectedSecurity(null)
    setPriceMode('perShare')
    setInputCurrency('native')
    reset({ exchangeRate: '1', type: '0' })
    setShowForm(true)
  }

  function openEditForm(t: Transaction) {
    setEditingTransaction(t)
    setSelectedSecurity(null)
    setPriceMode('perShare')
    setInputCurrency('native')
    reset({
      securitySearch: t.ticker ?? t.securityId,
      securityId: t.securityId,
      type: String(t.type),
      tradeDate: t.tradeDate,
      settlementDate: t.settlementDate,
      shares: String(t.shares),
      pricePerShare: String(t.pricePerShare),
      fees: String(t.fees),
      exchangeRate: String(t.exchangeRate),
      notes: t.notes ?? '',
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeForm() {
    setShowForm(false)
    setEditingTransaction(null)
    setSelectedSecurity(null)
    setPriceMode('perShare')
    setInputCurrency('native')
    reset({ exchangeRate: '1', type: '0' })
  }

  async function onSubmit(values: TxFormValues) {
    const shares = Number(values.shares)
    const exRate = Number(values.exchangeRate) || 1
    let pps = Number(values.pricePerShare)
    let fees = Number(values.fees) || 0
    if (priceMode === 'total') pps = pps / shares
    if (inputCurrency === 'cad' && currency !== 'CAD') {
      pps = pps / exRate
      fees = fees / exRate
    }
    if (editingTransaction) {
      await updateTransaction.mutateAsync({
        accountId: accountId!,
        transactionId: editingTransaction.id,
        tradeDate: values.tradeDate,
        settlementDate: values.settlementDate,
        shares,
        pricePerShare: pps,
        fees,
        exchangeRate: exRate,
        notes: values.notes || undefined,
      })
    } else {
      await addTransaction.mutateAsync({
        accountId: accountId!,
        securityId: values.securityId,
        type: Number(values.type) as TransactionType,
        tradeDate: values.tradeDate,
        settlementDate: values.settlementDate,
        shares,
        pricePerShare: pps,
        fees,
        exchangeRate: exRate,
        notes: values.notes || undefined,
      })
    }
    closeForm()
  }

  const isPending = addTransaction.isPending || updateTransaction.isPending

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
          onClick={openAddForm}
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

      {/* Add / Edit transaction form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingTransaction ? 'Edit transaction' : 'New transaction'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-3 gap-4">
            <div className="col-span-3 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Security</label>
              {editingTransaction ? (
                <div className="w-full border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-500">
                  {editingTransaction.ticker ?? editingTransaction.securityId}
                  <span className="ml-2 text-xs text-gray-400">(cannot be changed)</span>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              {editingTransaction ? (
                <div className="w-full border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-500">
                  {TX_TYPE_LABELS[editingTransaction.type]}
                  <span className="ml-2 text-xs text-gray-400">(cannot be changed)</span>
                </div>
              ) : (
                <select
                  {...register('type')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(TX_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              )}
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
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">
                  {priceMode === 'perShare' ? 'Price / share' : 'Total price'}
                  {' '}({inputCurrency === 'cad' ? 'CAD' : currency})
                </label>
                <div className="flex gap-1.5 text-xs">
                  <div className="flex rounded border border-gray-300 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setPriceMode('perShare')}
                      className={`px-2 py-0.5 cursor-pointer ${priceMode === 'perShare' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      /share
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriceMode('total')}
                      className={`px-2 py-0.5 cursor-pointer ${priceMode === 'total' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      total
                    </button>
                  </div>
                  {currency !== 'CAD' && (
                    <div className="flex rounded border border-gray-300 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setInputCurrency('native')}
                        className={`px-2 py-0.5 cursor-pointer ${inputCurrency === 'native' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                      >
                        {currency}
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputCurrency('cad')}
                        className={`px-2 py-0.5 cursor-pointer ${inputCurrency === 'cad' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                      >
                        CAD
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <input
                {...register('pricePerShare', { required: true })}
                type="number"
                step="any"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {(priceMode === 'total' || inputCurrency === 'cad') && effectivePps != null && (
                <p className="text-xs text-gray-500 mt-1">
                  = {effectivePps.toFixed(6)} {currency}/share stored
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fees ({inputCurrency === 'cad' ? 'CAD' : currency})
              </label>
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

            <div className="col-span-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="border border-gray-300 text-gray-700 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? 'Saving…' : editingTransaction ? 'Save changes' : 'Save transaction'}
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
                <tr
                  key={t.id}
                  className={`hover:bg-gray-50 ${editingTransaction?.id === t.id ? 'bg-blue-50' : ''}`}
                >
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
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => openEditForm(t)}
                        className="text-blue-500 hover:text-blue-700 text-xs cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => { if (await confirm({ title: 'Delete transaction', message: `Delete ${TX_TYPE_LABELS[t.type]} of ${t.ticker ?? 'this security'} on ${t.tradeDate}? ACB will be recalculated. This cannot be undone.` })) deleteTransaction.mutate({ accountId: accountId!, transactionId: t.id }) }}
                        className="text-red-500 hover:text-red-700 text-xs cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {dialog}
    </div>
  )
}
