import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import StatusBadge, { STATUS_LABELS } from '../../components/StatusBadge'
import { formatDate, formatTime } from '../../utils/format'

/** FR-06 report history and tracking. Owner: Jan Russel */
export default function MyReports() {
  const [status, setStatus] = useState('')
  const [reports, setReports] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setReports(null)
    api('/reports/mine.php', { query: { status } })
      .then(setReports)
      .catch((e) => setError(e.message))
  }, [status])

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h1 className="h3 mb-0">My reports</h1>
        <div className="d-flex gap-2">
          <select className="form-select form-select-sm" aria-label="Filter by status" value={status}
            onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <Link to="/report/new" className="btn btn-sm btn-report text-nowrap">Report an accident</Link>
        </div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {reports === null && !error && <p className="text-secondary">Loading…</p>}
      {reports?.length === 0 && (
        <div className="panel text-center py-5">
          <p className="mb-3">No reports here yet.</p>
          <Link to="/report/new" className="btn btn-report">Report an accident</Link>
        </div>
      )}
      <ul className="list-plain">
        {reports?.map((r) => (
          <li key={r.id}>
            <Link to={`/reports/${r.id}`} className="report-row">
              <span>
                <strong className="d-block">{r.report_code}</strong>
                <span className="d-block">{r.accident_type}, {r.location_text}</span>
                <span className="small text-secondary">
                  {formatDate(r.accident_date)} at {formatTime(r.accident_time)}
                </span>
              </span>
              <StatusBadge status={r.status} label={r.status_label} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
