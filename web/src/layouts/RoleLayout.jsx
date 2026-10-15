import { useAuth } from '../context/AuthContext'
import ReporterLayout from './ReporterLayout'
import StaffLayout from './StaffLayout'

/** Shared pages (report details, notifications) use the layout of whoever is logged in. */
export default function RoleLayout() {
  const { user } = useAuth()
  return user?.role === 'reporter' ? <ReporterLayout /> : <StaffLayout />
}
