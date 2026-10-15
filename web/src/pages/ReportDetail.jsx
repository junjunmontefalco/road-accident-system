import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import MapView from '../components/MapView'
import StatusBadge, { STATUS_LABELS } from '../components/StatusBadge'
import StatusTimeline from '../components/StatusTimeline'
import TodoPanel from '../components/TodoPanel'
import { useAuth } from '../context/AuthContext'
import { formatDate, formatDateTime, formatTime } from '../utils/format'

/**
 * One report, for every role (the API hides what a role may not see).
 * Reporter view: Jan Russel. Staff panels: Vince (admin) and Jan Russel (officer).
 */
export default function ReportDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [r, setR] = useState(null)
  const [error, setError] = useState('')
  const isStaff = user?.role === 'admin' || user?.role === 'officer'

  const load = useCallback(() => {
    api('/reports/view.php', { query: { id } }).then(setR).catch((e) => setError(e.message))
  }, [id])
  useEffect(load, [load])

  if (error) return <div className="alert alert-danger">{error}</div>
  if (!r) return <p className="text-secondary">Loading…</p>

  const back = user.role === 'reporter' ? '/my-reports' : user.role === 'admin' ? '/admin/reports' : '/officer'

  return (
    <div className="detail-page">
      <Link to={back} className="small">Back to reports</Link>
      <div className="d-flex flex-wrap align-items-center gap-3 mt-2 mb-1">
        <h1 className="h3 mb-0">{r.report_code}</h1>
        <StatusBadge status={r.status} label={r.status_label} />
        <span className={`record-kind ${r.is_official_record ? 'is-official' : ''}`}>
          {r.is_official_record ? 'Verified accident record' : 'Public report, not yet verified'}
        </span>
      </div>
      <p className="text-secondary">Submitted {formatDateTime(r.date_submitted)} from the {r.source} app</p>
      {r.status === 'rejected' && r.rejection_reason && (
        <div className="alert alert-danger">Rejected: {r.rejection_reason}</div>
      )}
      {isStaff && r.is_flagged && (
        <div className="alert alert-warning">
          Flagged: {r.flag_reason}
          {r.duplicate_of && <> (<Link to={`/reports/${r.duplicate_of}`}>see the earlier report</Link>)</>}
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-7 stack">
          <section className="panel">
            <h2 className="h5">Accident details</h2>
            <dl className="review-list">
              <dt>Date and time</dt><dd>{formatDate(r.accident_date)} at {formatTime(r.accident_time)}</dd>
              <dt>Type</dt><dd>{r.accident_type}</dd>
              <dt>Injuries</dt><dd>{r.injury_label}</dd>
              <dt>Vehicles</dt><dd>{r.vehicles.map((v) => `${v.quantity} ${v.type}`).join(', ') || 'None listed'}</dd>
              <dt>Location</dt><dd>{[r.location_text, r.barangay, r.municipality].filter(Boolean).join(', ')}</dd>
              {r.latitude != null && (
                <><dt>GPS</dt><dd>{r.latitude.toFixed(6)}, {r.longitude.toFixed(6)}</dd></>
              )}
              <dt>What happened</dt><dd className="pre-wrap">{r.description}</dd>
              {isStaff && r.reporter && (
                <><dt>Reporter</dt><dd>{r.reporter.name}, {r.reporter.contact}</dd></>
              )}
              {r.assigned_officer && (<><dt>Assigned officer</dt><dd>{r.assigned_officer.name}</dd></>)}
              {isStaff && r.verified_by && (<><dt>Verified by</dt><dd>{r.verified_by}, {formatDateTime(r.verified_at)}</dd></>)}
            </dl>
          </section>

          {r.latitude != null && (
            <section className="panel mt-4">
              <h2 className="h5">Map</h2>
              <MapView lat={r.latitude} lng={r.longitude} />
            </section>
          )}

          <section className="panel mt-4">
            <h2 className="h5">Photos</h2>
            {r.photos.length === 0 ? (
              <p className="text-secondary mb-0">No photos were attached.</p>
            ) : (
              <div className="photo-grid">
                {r.photos.map((p) => (
                  <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="photo-tile">
                    <img src={p.url} alt={p.name || 'Accident photo'} />
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="col-lg-5 stack">
          {isStaff && <StatusPanel report={r} onChanged={load} />}
          {user.role === 'admin' && r.status === 'verified' && (
            <TodoPanel title="Assign an officer" owner="Vince (page) + Juliana (api/reports/assign.php)"
              requirement="FR-07" items={['Dropdown from GET /users/list.php?role=officer', 'POST /reports/assign.php { id, officer_id }']} />
          )}
          {isStaff && (
            <TodoPanel title="Add remarks, findings and actions" owner="Jan Russel (page) + Juliana (api/reports/add-remark.php)"
              items={['Form: type (remark, finding, action), text, hide from reporter checkbox']} />
          )}

          <section className="panel mt-4">
            <h2 className="h5">Status history</h2>
            <StatusTimeline history={r.history} />
          </section>

          {r.remarks.length > 0 && (
            <section className="panel mt-4">
              <h2 className="h5">{isStaff ? 'Remarks and findings' : 'Updates from the traffic office'}</h2>
              <ul className="list-plain mb-0">
                {r.remarks.map((m) => (
                  <li key={m.id} className="py-2 border-bottom">
                    <span className="small text-secondary text-capitalize">{m.type}</span>
                    {isStaff && m.is_internal && <span className="small text-secondary">, internal</span>}
                    <p className="mb-0">{m.content}</p>
                    <span className="small text-secondary">{m.officer}, {formatDateTime(m.date)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

/** FR-07/FR-08: move the report to its next status. Uses the moves the API says are allowed. */
function StatusPanel({ report, onChanged }) {
  const options = (report.allowed_next_statuses || []).filter((s) => s !== 'assigned')
  const [to, setTo] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!options.length) {
    return (
      <section className="panel">
        <h2 className="h5">Update status</h2>
        <p className="text-secondary mb-0">
          {report.status === 'verified' ? 'Next step: assign an officer.' : 'No further status changes for you on this report.'}
        </p>
      </section>
    )
  }

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/reports/update-status.php', {
        method: 'POST',
        body: { id: report.id, status: to, note: note || null, reason: to === 'rejected' ? note : null },
      })
      setTo('')
      setNote('')
      onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="panel" onSubmit={save}>
      <h2 className="h5">Update status</h2>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      <label className="form-label" htmlFor="next-status">Change to</label>
      <select id="next-status" className="form-select mb-2" value={to} onChange={(e) => setTo(e.target.value)} required>
        <option value="">Choose…</option>
        {options.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </select>
      <label className="form-label" htmlFor="status-note">
        {to === 'rejected' ? 'Reason for rejecting (the reporter sees this)' : to === 'info_required' ? 'What information is missing?' : 'Note (optional)'}
      </label>
      <textarea id="status-note" rows="2" className="form-control mb-3" value={note} onChange={(e) => setNote(e.target.value)}
        required={to === 'rejected'} />
      <button className="btn btn-guide" disabled={busy || !to}>{busy ? 'Saving…' : 'Save status'}</button>
    </form>
  )
}
