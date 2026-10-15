// FR-06 report history and tracking. Owner: Jan Russel
import { api } from '../api.js'
import { startPage } from '../app.js'
import { $, esc, formatDate, formatTime, param, statusBadge, statusOptions } from '../ui.js'

await startPage({ roles: ['reporter'] })
const select = $('#status-filter')
select.insertAdjacentHTML('beforeend', statusOptions(param('status') || ''))

async function load() {
  const list = $('#reports')
  list.innerHTML = '<li class="text-secondary">Loading…</li>'
  try {
    const reports = await api('/reports/mine.php', { query: { status: select.value } })
    list.innerHTML = reports.length
      ? reports
          .map(
            (r) => `<li><a href="report.html?id=${r.id}" class="report-row">
              <span><strong class="d-block">${esc(r.report_code)}</strong>
              <span class="d-block">${esc(r.accident_type)}, ${esc(r.location_text)}</span>
              <span class="small text-secondary">${esc(formatDate(r.accident_date))} at ${esc(formatTime(r.accident_time))}</span></span>
              ${statusBadge(r.status, r.status_label)}</a></li>`,
          )
          .join('')
      : `<li class="panel text-center py-5"><p class="mb-3">No reports here yet.</p><a href="report-new.html" class="btn btn-report">Report an accident</a></li>`
  } catch (e) {
    list.innerHTML = `<li class="alert alert-danger">${esc(e.message)}</li>`
  }
}
select.addEventListener('change', load)
load()
