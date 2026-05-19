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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg border border-gray-200 p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Sign in</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              {...register('email')}
              type="email"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              {...register('password')}
              type="password"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>
          {errors.root && <p className="text-red-600 text-sm">{errors.root.message}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-4 text-center">
          No account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
