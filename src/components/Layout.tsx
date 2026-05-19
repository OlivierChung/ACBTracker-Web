import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { version } from '../../package.json'

export function Layout() {
  const { email, logout } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-semibold text-gray-900">
            ACBTracker
          </Link>
          <Link to="/securities" className="text-sm text-gray-600 hover:text-gray-900">
            Securities
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/profile" className="text-sm text-gray-500 hover:text-gray-900">
            {email}
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </nav>
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white py-3 px-6 text-center text-xs text-gray-400">
        &copy; 2026 ACBTracker &mdash; v{version}
      </footer>
    </div>
  )
}
