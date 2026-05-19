import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Required'),
})

type FormValues = z.infer<typeof schema>

const features = [
  {
    title: 'Accurate ACB tracking',
    description:
      'Automatically calculates adjusted cost base using CRA average-cost rules across all your accounts.',
  },
  {
    title: 'Multi-account support',
    description:
      'Manage RRSP, TFSA, FHSA, RESP, RRIF, and taxable accounts under a single portfolio.',
  },
  {
    title: 'Real exchange rates',
    description:
      'Fetches Bank of Canada rates for any trade date so foreign-currency positions are always in CAD.',
  },
  {
    title: 'Full transaction history',
    description:
      'Buys, sells, DRIPs, return of capital, stock splits, superficial loss adjustments — all covered.',
  },
  {
    title: 'Realized gain & loss',
    description:
      'Every sell transaction instantly shows your realized capital gain or loss in CAD.',
  },
  {
    title: 'Portfolio dashboard',
    description:
      'See your current holdings and recent activity for your default portfolio right from the home page.',
  },
]

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    try {
      const { data } = await api.post<{ token: string; userId: string; email: string }>(
        '/auth/login',
        values,
      )
      login(data.token, data.userId, data.email)
      navigate('/')
    } catch {
      setError('root', { message: 'Invalid email or password' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-semibold text-gray-900">ACBTracker</span>
        <Link
          to="/register"
          className="text-sm text-blue-600 font-medium hover:text-blue-700"
        >
          Create account
        </Link>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-white border-b border-gray-200 py-16 px-6 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Track your adjusted cost base,<br className="hidden sm:block" /> effortlessly
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10">
            ACBTracker helps Canadian investors calculate capital gains accurately — across every
            account type, currency, and transaction kind.
          </p>

          {/* Login card */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 w-full max-w-sm mx-auto text-left">
            <h2 className="text-base font-semibold text-gray-900 mb-5">Sign in to your account</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.email && (
                  <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="current-password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.password && (
                  <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>
              {errors.root && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {errors.root.message}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            <p className="text-sm text-gray-500 mt-4 text-center">
              No account?{' '}
              <Link to="/register" className="text-blue-600 hover:underline font-medium">
                Register for free
              </Link>
            </p>
          </div>
        </section>

        {/* About */}
        <section className="py-16 px-6 max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Built for Canadian investors</h2>
          <p className="text-gray-500 leading-relaxed">
            The Canada Revenue Agency requires investors to track the adjusted cost base (ACB) of
            every security they hold in taxable accounts. Getting it wrong means miscalculating
            capital gains — and potentially paying the wrong amount of tax. ACBTracker does the
            math for you: it applies CRA average-cost rules, handles return-of-capital reductions,
            superficial loss adjustments, stock splits, and more, so your records are always
            audit-ready.
          </p>
        </section>

        {/* Features */}
        <section className="bg-white border-t border-gray-200 py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
              Everything you need
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((f) => (
                <div key={f.title}>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg mb-3 flex items-center justify-center">
                    <div className="w-3 h-3 bg-blue-600 rounded-sm" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white py-4 px-6 text-center text-xs text-gray-400">
        &copy; 2026 ACBTracker
      </footer>
    </div>
  )
}
