import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
})

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    try {
      await api.post('/auth/register', values)
      navigate('/login')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data
          ?.errors
          ? 'Registration failed. Check the form for errors.'
          : 'Something went wrong.'
      setError('root', { message: msg })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg border border-gray-200 p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Create account</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
              <input
                {...register('firstName')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.firstName && (
                <p className="text-red-600 text-xs mt-1">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
              <input
                {...register('lastName')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.lastName && (
                <p className="text-red-600 text-xs mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>
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
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
