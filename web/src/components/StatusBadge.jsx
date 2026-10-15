// Labels match api/core/status.php exactly
export const STATUS_LABELS = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  info_required: 'Additional Information Required',
  verified: 'Verified',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved / Closed',
  rejected: 'Rejected',
}

export default function StatusBadge({ status, label }) {
  return <span className={`status-badge status-${status}`}>{label || STATUS_LABELS[status] || status}</span>
}
