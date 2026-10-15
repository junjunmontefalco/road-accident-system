import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { formatDateTime } from '../utils/format'

/** FR-09 notifications for every role. Owner: Jan Russel */
export default function Notifications() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const load = () => api('/notifications/list.php').then(setData).catch((e) => setError(e.message))
  useEffect(() => {
    load()
  }, [])

  const open = async (n) => {
    if (!n.is_read) await api('/notifications/read.php', { method: 'POST', body: { id: n.id } }).catch(() => {})
    if (n.report_id) navigate(`/reports/${n.report_id}`)
    else load()
  }

  return (
    <div className="form-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Notifications</h1>
        {data?.unread_count > 0 && (
          <button className="btn btn-sm btn-outline-secondary"
            onClick={() => api('/notifications/read.php', { method: 'POST', body: { all: true } }).then(load)}>
            Mark all as read
          </button>
        )}
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {data?.items.length === 0 && <p className="text-secondary">No notifications yet.</p>}
      <ul className="list-plain">
        {data?.items.map((n) => (
          <li key={n.id}>
            <button className={`notif-row ${n.is_read ? '' : 'is-unread'}`} onClick={() => open(n)}>
              <strong className="d-block">{n.title}</strong>
              <span className="d-block">{n.message}</span>
              <span className="small text-secondary">{formatDateTime(n.date)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
