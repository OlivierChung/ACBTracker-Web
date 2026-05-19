import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { usePortfolio } from '../hooks/usePortfolios'
import { useCreateAccount, useDeleteAccount } from '../hooks/useAccounts'
import { AccountType } from '../types'

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  [AccountType.Taxable]: 'Taxable',
  [AccountType.RRSP]: 'RRSP',
  [AccountType.TFSA]: 'TFSA',
  [AccountType.RESP]: 'RESP',
  [AccountType.RRIF]: 'RRIF',
  [AccountType.FHSA]: 'FHSA',
}

export function PortfolioPage() {
  const { portfolioId } = useParams<{ portfolioId: string }>()
  const { data: portfolio, isLoading } = usePortfolio(portfolioId!)
  const createAccount = useCreateAccount()
  const deleteAccount = useDeleteAccount()
  const [showForm, setShowForm] = useState(false)
  const { register, handleSubmit, reset } = useForm<{
    name: string
    type: string
    institutionName: string
    accountNumber: string
  }>()

  async function onCreate(values: {
    name: string
    type: string
    institutionName: string
    accountNumber: string
  }) {
    await createAccount.mutateAsync({
      portfolioId: portfolioId!,
      name: values.name,
      type: Number(values.type) as AccountType,
      institutionName: values.institutionName || undefined,
      accountNumber: values.accountNumber || undefined,
    })
    reset()
    setShowForm(false)
  }

  if (isLoading) return <p className="text-gray-500">Loading…</p>
  if (!portfolio) return <p className="text-red-500">Portfolio not found.</p>

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-gray-900">
          Portfolios
        </Link>
        <span>/</span>
        <span className="text-gray-900">{portfolio.name}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{portfolio.name}</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 cursor-pointer"
        >
          New account
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onCreate)}
          className="bg-white border border-gray-200 rounded-lg p-4 mb-6 grid grid-cols-2 gap-3"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              {...register('name', { required: true })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account type</label>
            <select
              {...register('type')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institution (optional)
            </label>
            <input
              {...register('institutionName')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account number (optional)
            </label>
            <input
              {...register('accountNumber')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 cursor-pointer"
            >
              Create account
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3">
        {(portfolio as unknown as { accounts?: { id: string; name: string; type: AccountType }[] })
          .accounts?.length === 0 && (
          <p className="text-gray-500 text-sm">No accounts yet.</p>
        )}
        {(
          portfolio as unknown as { accounts?: { id: string; name: string; type: AccountType }[] }
        ).accounts?.map((a) => (
          <div
            key={a.id}
            className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <Link
                to={`/portfolios/${portfolioId}/accounts/${a.id}`}
                className="font-medium text-gray-900 hover:text-blue-600"
              >
                {a.name}
              </Link>
              <p className="text-sm text-gray-500">{ACCOUNT_TYPE_LABELS[a.type]}</p>
            </div>
            <button
              onClick={() => deleteAccount.mutate({ portfolioId: portfolioId!, accountId: a.id })}
              className="text-sm text-red-500 hover:text-red-700 cursor-pointer"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
