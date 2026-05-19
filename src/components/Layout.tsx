import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { version } from '../../package.json'
import { Logo } from './Logo'
import { useProfile } from '../hooks/useProfile'

export function Layout() {
  const { logout } = useAuthStore()
  const { data: profile } = useProfile()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/">
            <Logo size={28} />
          </Link>
          <Link to="/securities" className="text-sm text-gray-600 hover:text-gray-900">
            Securities
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {profile?.firstName && (
            <span className="text-sm text-gray-600">
              Hello, <span className="font-medium text-gray-900">{profile.firstName}</span>
            </span>
          )}
          <Link
            to="/profile"
            title="Profile"
            className="text-gray-400 hover:text-blue-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
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
