import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import StatusBadge, { STATUS_LABELS } from './StatusBadge'
import { formatDate } from '../utils/format'

/**
 * FR-07 + FR-11: searchable, filterable report list for admins and officers.
 * The API already limits officers to their assigned reports.
 * Owner: Vince (admin) — Jan Russel reuses it for the officer portal.
 */
export default function ReportsTable() {
  const navigate = useNavigate()
  const [types, setTypes] = useState([])
  const [filters, setFilters] = useState({ q: '', status: '', accident_type_id: '', date_from: '', date_to: '', flagged: '' })
  const [applied, setApplied] = useState(filters)
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/accident-types/list.php').then((d) => setTypes(d.accident_types)).catch(() => {})
  }, [])

  useEffect(() => {
    setData(null)
    api('/reports/list.php', { query: { ...applied, page, per_page: 15 } })
      .then(setData)
      .catch((e) => setError(e.message))
  }, [applied, page])

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.type === 'change' && e.target.type === 'checkbox' ? (e.target.checked ? '1' : '') : e.target.value })
  const search = (e) => {
    e.preventDefault()
    setPage(1)
    setApplied(filters)
  }

  return (
    <div>
      <form className="filter-bar" onSubmit={search}>
        <input className="form-control" placeholder="Search report ID, place or description" aria-label="Search"
          value={filters.q} onChange={set('q')} />
        <select className="form-select" aria-label="Status" value={filters.status} onChange={set('status')}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="form-select" aria-label="Accident type" value={filters.accident_type_id} onChange={set('accident_type_id')}>
          <option value="">All types</option>
          {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input type="date" className="form-control" aria-label="From date" value={filters.date_from} onChange={set('date_from')} />
        <input type="date" className="form-control" aria-label="To date" value={filters.date_to} onChange={set('date_to')} />
        <label className="form-check d-flex align-items-center gap-2 mb-0">
          <input type="checkbox" className="form-check-input mt-0" checked={filters.flagged === '1'} onChange={set('flagged')} />
          Flagged only
        </label>
        <button className="btn btn-guide">Search</button>
      </form>

      {error && <div className="alert alert-danger">{error}</div>}
      <div className="table-responsive panel p-0">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Report ID</th>
              <th>Accident date</th>
              <th>Location</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data === null && !error && (
              <tr><td colSpan="5" className="text-secondary">Loading…</td></tr>
            )}
            {data?.items.length === 0 && (
              <tr><td colSpan="5" className="text-secondary">No reports match these filters.</td></tr>
            )}
            {data?.items.map((r) => (
              <tr key={r.id} className="clickable" onClick={() => navigate(`/reports/${r.id}`)}>
                <td className="code-cell">
                  <a href={`/reports/${r.id}`} onClick={(e) => e.preventDefault()} className="fw-semibold">{r.report_code}</a>
                  {r.is_flagged && <span className="flag-dot" title={r.flag_reason}>Flagged</span>}
                </td>
                <td>{formatDate(r.accident_date)}</td>
                <td>{[r.location_text, r.municipality].filter(Boolean).join(', ')}</td>
                <td>{r.accident_type}</td>
                <td><StatusBadge status={r.status} label={r.status_label} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && data.total_pages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <span className="small text-secondary">{data.total} reports, page {data.page} of {data.total_pages}</span>
          <div className="btn-group">
            <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <button className="btn btn-sm btn-outline-secondary" disabled={page >= data.total_pages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
