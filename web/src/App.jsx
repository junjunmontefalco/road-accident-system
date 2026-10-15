import { Link, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import ReporterLayout from './layouts/ReporterLayout'
import RoleLayout from './layouts/RoleLayout'
import StaffLayout from './layouts/StaffLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Notifications from './pages/Notifications'
import Register from './pages/Register'
import ReportDetail from './pages/ReportDetail'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminReports from './pages/admin/AdminReports'
import { AdminAudit, AdminCategories, AdminSummaries, AdminUsers } from './pages/admin/AdminTodoPages'
import OfficerReports from './pages/officer/OfficerReports'
import MyReports from './pages/reporter/MyReports'
import ReportForm from './pages/reporter/ReportForm'
import ReportSubmitted from './pages/reporter/ReportSubmitted'
import ReporterHome from './pages/reporter/ReporterHome'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Public users (reporters) */}
      <Route element={<ProtectedRoute roles={['reporter']} />}>
        <Route element={<ReporterLayout />}>
          <Route path="/home" element={<ReporterHome />} />
          <Route path="/report/new" element={<ReportForm />} />
          <Route path="/report/submitted/:id" element={<ReportSubmitted />} />
          <Route path="/my-reports" element={<MyReports />} />
        </Route>
      </Route>

      {/* Administrators */}
      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route element={<StaffLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/summaries" element={<AdminSummaries />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/audit" element={<AdminAudit />} />
        </Route>
      </Route>

      {/* Traffic officers */}
      <Route element={<ProtectedRoute roles={['officer']} />}>
        <Route element={<StaffLayout />}>
          <Route path="/officer" element={<OfficerReports />} />
        </Route>
      </Route>

      {/* Shared by every role */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleLayout />}>
          <Route path="/reports/:id" element={<ReportDetail />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <div className="auth-page">
            <div className="auth-card text-center">
              <h1 className="h4">Page not found</h1>
              <Link to="/">Go to the home page</Link>
            </div>
          </div>
        }
      />
    </Routes>
  )
}
