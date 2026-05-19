import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useCreatePortfolio, useDeletePortfolio, usePortfolios } from '../hooks/usePortfolios'

export function PortfoliosPage() {
  const { data: portfolios, isLoading } = usePortfolios()
  const createPortfolio = useCreatePortfolio()
  const deletePortfolio = useDeletePortfolio()
  const [showForm, setShowForm] = useState(false)
  const { register, handleSubmit, reset } = useForm<{ name: string; description: string }>()

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
            className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <Link
                to={`/portfolios/${p.id}`}
                className="font-medium text-gray-900 hover:text-blue-600"
              >
                {p.name}
              </Link>
              {p.description && <p className="text-sm text-gray-500 mt-0.5">{p.description}</p>}
            </div>
            <button
              onClick={() => deletePortfolio.mutate(p.id)}
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
