// Reporter home: the big report button, latest reports, emergency contacts. Owner: Jan Russel
import { api } from '../api.js'
import { startPage } from '../app.js'
import { $, esc, formatDate, statusBadge } from '../ui.js'

const user = await startPage({ roles: ['reporter'] })
$('#first-name').textContent = user.full_name.split(' ')[0]

api('/reports/mine.php')
  .then((reports) => {
    const waiting = reports.filter((r) => r.status === 'info_required')
    if (waiting.length) {
      $('#needs-info').innerHTML = `<div class="alert alert-warning mt-3 mb-0">
        <strong>The traffic office needs more information</strong> on
        ${waiting.map((r) => `<a href="report.html?id=${r.id}" class="alert-link">${esc(r.report_code)}</a>`).join(', ')}.
        Open the report to answer.</div>`
    }
    $('#latest').innerHTML = reports.length
      ? reports
          .slice(0, 3)
          .map(
            (r) => `<li><a href="report.html?id=${r.id}" class="report-row">
              <span><strong class="d-block">${esc(r.report_code)}</strong>
              <span class="small text-secondary">${esc(formatDate(r.accident_date))}, ${esc(r.location_text)}</span></span>
              ${statusBadge(r.status, r.status_label)}</a></li>`,
          )
          .join('')
      : '<li class="text-secondary">You have not sent any reports yet.</li>'
  })
  .catch((e) => ($('#latest').innerHTML = `<li class="text-danger">${esc(e.message)}</li>`))

api('/emergency-contacts/list.php')
  .then((contacts) => {
    $('#contacts').innerHTML = contacts
      .map(
        (c) => `<li class="d-flex justify-content-between gap-2 py-1">
          <span>${esc(c.name)}${c.category ? `<span class="small text-secondary d-block">${esc(c.category)}</span>` : ''}</span>
          <a href="tel:${esc(c.phone.replace(/[^0-9+]/g, ''))}" class="fw-semibold text-nowrap">${esc(c.phone)}</a></li>`,
      )
      .join('')
  })
  .catch(() => {})
