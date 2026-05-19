import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSecurities, useCreateSecurity, useUpdateSecurity, useDeleteSecurity } from '../hooks/useSecurities'
import { SecurityType } from '../types'
import type { Security } from '../types'
import { useConfirm } from '../components/ConfirmDialog'

const SECURITY_TYPE_LABELS: Record<SecurityType, string> = {
  [SecurityType.Stock]: 'Stock',
  [SecurityType.ETF]: 'ETF',
  [SecurityType.MutualFund]: 'Mutual Fund',
  [SecurityType.Bond]: 'Bond',
  [SecurityType.Option]: 'Option',
  [SecurityType.Crypto]: 'Crypto',
  [SecurityType.Other]: 'Other',
}

interface CreateFormValues {
  ticker: string
  name: string
  exchange: string
  currency: string
  type: string
  isin: string
  cusip: string
}

interface EditFormValues {
  name: string
  exchange: string
  type: string
}

function EditRow({
  security,
  onDone,
}: {
  security: Security
  onDone: () => void
}) {
  const updateSecurity = useUpdateSecurity()
  const { register, handleSubmit } = useForm<EditFormValues>({
    defaultValues: {
      name: security.name,
      exchange: security.exchange,
      type: String(security.type),
    },
  })

  async function onSubmit(values: EditFormValues) {
    await updateSecurity.mutateAsync({
      id: security.id,
      name: values.name,
      exchange: values.exchange,
      type: Number(values.type) as SecurityType,
    })
    onDone()
  }

  return (
    <tr className="bg-blue-50">
      <td className="px-4 py-2 text-gray-500 text-sm">{security.ticker}</td>
      <td className="px-4 py-2">
        <input
          {...register('name', { required: true })}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </td>
      <td className="px-4 py-2">
        <input
          {...register('exchange', { required: true })}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </td>
      <td className="px-4 py-2 text-gray-500 text-sm">{security.currency}</td>
      <td className="px-4 py-2">
        <select
          {...register('type')}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.entries(SECURITY_TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-2 text-right">
        <div className="flex justify-end gap-2">
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={updateSecurity.isPending}
            className="text-blue-600 hover:text-blue-800 text-xs font-medium cursor-pointer disabled:opacity-50"
          >
            {updateSecurity.isPending ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={onDone}
            className="text-gray-500 hover:text-gray-700 text-xs cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  )
}

export function SecuritiesPage() {
  const { data: securities, isLoading } = useSecurities()
  const createSecurity = useCreateSecurity()
  const deleteSecurity = useDeleteSecurity()
  const { confirm, dialog } = useConfirm()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { register, handleSubmit, reset } = useForm<CreateFormValues>({
    defaultValues: { currency: 'CAD', type: '0' },
  })

  async function onCreate(values: CreateFormValues) {
    await createSecurity.mutateAsync({
      ticker: values.ticker,
      name: values.name,
      exchange: values.exchange,
      currency: values.currency,
      type: Number(values.type) as SecurityType,
      isin: values.isin || undefined,
      cusip: values.cusip || undefined,
    })
    reset({ currency: 'CAD', type: '0' })
    setShowForm(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Securities</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 cursor-pointer"
        >
          Add security
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-base font-medium text-gray-900 mb-4">New security</h2>
          <form onSubmit={handleSubmit(onCreate)} className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ticker</label>
              <input
                {...register('ticker', { required: true })}
                placeholder="e.g. VFV"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                {...register('name', { required: true })}
                placeholder="e.g. Vanguard S&P 500 Index ETF"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exchange</label>
              <input
                {...register('exchange', { required: true })}
                placeholder="e.g. TSX"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <input
                {...register('currency', { required: true })}
                placeholder="CAD"
                maxLength={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                {...register('type')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(SECURITY_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ISIN (optional)</label>
              <input
                {...register('isin')}
                placeholder="12 characters"
                maxLength={12}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CUSIP (optional)</label>
              <input
                {...register('cusip')}
                placeholder="9 characters"
                maxLength={9}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={createSecurity.isPending}
                className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                {createSecurity.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ticker</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Exchange</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Currency</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {securities?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                    No securities yet.
                  </td>
                </tr>
              )}
              {securities?.map((s) =>
                editingId === s.id ? (
                  <EditRow key={s.id} security={s} onDone={() => setEditingId(null)} />
                ) : (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.ticker}</td>
                    <td className="px-4 py-3 text-gray-700">{s.name}</td>
                    <td className="px-4 py-3 text-gray-700">{s.exchange}</td>
                    <td className="px-4 py-3 text-gray-700">{s.currency}</td>
                    <td className="px-4 py-3 text-gray-700">{SECURITY_TYPE_LABELS[s.type]}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setEditingId(s.id)}
                          className="text-blue-500 hover:text-blue-700 text-xs cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => { if (await confirm({ title: 'Delete security', message: `${s.ticker} — ${s.name} will be permanently deleted.` })) deleteSecurity.mutate(s.id) }}
                          className="text-red-500 hover:text-red-700 text-xs cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
      {dialog}
    </div>
  )
}
