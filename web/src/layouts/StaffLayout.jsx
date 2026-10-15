import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import Brand from '../components/Brand'
import { useAuth } from '../context/AuthContext'
import useUnreadCount from '../hooks/useUnreadCount'

const ADMIN_LINKS = [
  ['/admin', 'Dashboard'],
  ['/admin/reports', 'Accident reports'],
  ['/admin/summaries', 'Summaries and export'],
  ['/admin/users', 'Users'],
  ['/admin/categories', 'Categories and settings'],
  ['/admin/audit', 'Audit trail'],
]
const OFFICER_LINKS = [['/officer', 'Assigned reports']]

/** Sidebar layout for admins (Vince) and traffic officers (Jan Russel). */
export default function StaffLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const unread = useUnreadCount()
  const links = user?.role === 'admin' ? ADMIN_LINKS : OFFICER_LINKS

  return (
    <div className="staff-shell">
      <aside className="sidebar">
        <div className="px-3 pt-3 pb-4">
          <Brand light />
          <div className="small text-white-50 mt-2">{user?.role === 'admin' ? 'Administrator' : 'Traffic officer'}</div>
        </div>
        <nav className="side-nav" aria-label="Main">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/admin' || to === '/officer'}>
              {label}
            </NavLink>
          ))}
          <NavLink to="/notifications">
            Notifications{unread > 0 && <span className="count-pill">{unread}</span>}
          </NavLink>
        </nav>
        <div className="sidebar-foot">
          <div className="small text-white mb-2 text-truncate">{user?.full_name}</div>
          <button
            className="btn btn-sm btn-outline-light w-100"
            onClick={async () => {
              await logout()
              navigate('/login')
            }}
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="staff-main">
        <Outlet />
      </main>
    </div>
  )
}
