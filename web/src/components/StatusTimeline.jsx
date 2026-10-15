import StatusBadge from './StatusBadge'
import { formatDateTime } from '../utils/format'

/** FR-06 tracking: every status the report went through, oldest first. */
export default function StatusTimeline({ history }) {
  if (!history?.length) return <p className="text-secondary">No status changes yet.</p>
  return (
    <ol className="timeline">
      {history.map((h, i) => (
        <li key={i} className={i === history.length - 1 ? 'is-current' : ''}>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <StatusBadge status={h.status} label={h.status_label} />
            <time className="small text-secondary">{formatDateTime(h.date)}</time>
          </div>
          {h.note && <p className="mb-0 mt-1">{h.note}</p>}
          {h.changed_by && <p className="small text-secondary mb-0">by {h.changed_by}</p>}
        </li>
      ))}
    </ol>
  )
}
