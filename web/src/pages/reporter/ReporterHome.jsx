import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/format'

/** Reporter home: the big report button + latest reports. Owner: Jan Russel */
export default function ReporterHome() {
  const { user } = useAuth()
  const [reports, setReports] = useState(null)
  const [contacts, setContacts] = useState([])

  useEffect(() => {
    api('/reports/mine.php').then(setReports).catch(() => setReports([]))
    api('/emergency-contacts/list.php').then(setContacts).catch(() => {})
  }, [])

  const firstName = user?.full_name?.split(' ')[0]

  return (
    <div className="row g-4">
      <div className="col-lg-7">
        <h1 className="h3 mb-3">Hi {firstName}</h1>
        <Link to="/report/new" className="report-sign">
          <span className="report-sign-title">Report an accident</span>
          <span className="report-sign-sub">Takes about 3 minutes. Photos are optional.</span>
        </Link>

        <div className="d-flex justify-content-between align-items-baseline mt-4 mb-2">
          <h2 className="h5 mb-0">Your latest reports</h2>
          <Link to="/my-reports" className="small">See all</Link>
        </div>
        {reports === null && <p className="text-secondary">Loading…</p>}
        {reports?.length === 0 && <p className="text-secondary">You have not sent any reports yet.</p>}
        <ul className="list-plain">
          {reports?.slice(0, 3).map((r) => (
            <li key={r.id}>
              <Link to={`/reports/${r.id}`} className="report-row">
                <span>
                  <strong className="d-block">{r.report_code}</strong>
                  <span className="small text-secondary">
                    {formatDate(r.accident_date)}, {r.location_text}
                  </span>
                </span>
                <StatusBadge status={r.status} label={r.status_label} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <aside className="col-lg-5">
        <section className="panel">
          <h2 className="h6">Emergency contacts</h2>
          <p className="small text-secondary">Call first if someone is hurt.</p>
          <ul className="list-plain mb-0">
            {contacts.map((c) => (
              <li key={c.id} className="d-flex justify-content-between py-1">
                <span>{c.name}</span>
                <a href={`tel:${c.phone}`} className="fw-semibold">{c.phone}</a>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  )
}
