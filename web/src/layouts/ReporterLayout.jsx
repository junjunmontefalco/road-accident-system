import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import Brand from '../components/Brand'
import { useAuth } from '../context/AuthContext'
import useUnreadCount from '../hooks/useUnreadCount'

/** Top bar for public users (reporters). Owner: Jan Russel */
export default function ReporterLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const unread = useUnreadCount()

  return (
    <div className="reporter-shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/home" className="text-decoration-none">
            <Brand light />
          </Link>
          <nav className="topnav" aria-label="Main">
            <NavLink to="/home" end>Home</NavLink>
            <NavLink to="/my-reports">My reports</NavLink>
            <NavLink to="/notifications">
              Notifications{unread > 0 && <span className="count-pill">{unread}</span>}
            </NavLink>
          </nav>
          <div className="d-flex align-items-center gap-3">
            <span className="small text-white-50 d-none d-md-inline">{user?.full_name}</span>
            <button
              className="btn btn-sm btn-outline-light"
              onClick={async () => {
                await logout()
                navigate('/login')
              }}
            >
              Log out
            </button>
          </div>
        </div>
        <div className="lane-line" aria-hidden="true" />
      </header>
      <main className="container py-4">
        <Outlet />
      </main>
    </div>
  )
}
