import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import TodoPanel from '../../components/TodoPanel'

/** FR-10 dashboard. Owner: Vince. The summary cards already work; build the rest. */
export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/dashboard/summary.php').then(setData).catch((e) => setError(e.message))
  }, [])

  const cards = [
    ['total', 'All reports', '/admin/reports'],
    ['pending', 'Waiting for review', '/admin/reports'],
    ['verified', 'Verified records', '/admin/reports'],
    ['closed', 'Resolved and closed', '/admin/reports'],
    ['flagged', 'Flagged', '/admin/reports'],
  ]

  return (
    <div>
      <h1 className="h3 mb-3">Dashboard</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="stat-grid">
        {cards.map(([key, label, to]) => (
          <Link key={key} to={to} className={`stat-card stat-${key}`}>
            <span className="stat-value">{data ? data.cards[key] : '–'}</span>
            <span className="stat-label">{label}</span>
          </Link>
        ))}
      </div>
      <TodoPanel
        title="Charts, map and recent reports"
        owner="Vince"
        requirement="FR-10"
        items={[
          'Add by_type, by_month, by_municipality, map_points and recent to api/dashboard/summary.php (hints are in that file)',
          'Trend line by month and accident-type donut: npm install chart.js react-chartjs-2',
          'Map of accident locations: reuse react-leaflet like components/MapView.jsx, one marker per map point',
          'Recent reports: reuse components/ReportsTable.jsx or a short list',
        ]}
      />
    </div>
  )
}
