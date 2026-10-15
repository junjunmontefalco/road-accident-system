// Submission confirmation with the report ID. Owner: Jan Russel
import { api } from '../api.js'
import { startPage } from '../app.js'
import { $, esc, param } from '../ui.js'

await startPage({ roles: ['reporter', 'admin'], active: 'home.html' })
const id = param('id')
$('#view-link').href = `report.html?id=${encodeURIComponent(id)}`
api('/reports/view.php', { query: { id } })
  .then((r) => {
    $('#code').textContent = r.report_code
    $('#code').hidden = false
    if (r.photos.length) $('#photo-note').textContent = `${r.photos.length} photo(s) attached.`
  })
  .catch((e) => ($('#code-error').innerHTML = `<div class="alert alert-warning">${esc(e.message)}</div>`))
