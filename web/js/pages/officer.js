// Officer portal: reports assigned to me. Owner: Jan Russel
import { api } from '../api.js'
import { startPage } from '../app.js'
import { mountReportsTable } from '../reports-table.js'
import { $ } from '../ui.js'

const user = await startPage({ roles: ['officer'] })
$('#first-name').textContent = user.full_name

// Counts per status for the cards (one request for all assigned reports)
api('/reports/list.php', { query: { per_page: 100 } })
  .then((d) => {
    const count = (s) => d.items.filter((r) => r.status === s).length
    const cards = [
      ['assigned', 'New, not started', count('assigned')],
      ['in_progress', 'In progress', count('in_progress')],
      ['resolved', 'Resolved', count('resolved')],
    ]
    $('#cards').innerHTML = cards
      .map(([s, label, n]) => `<a href="officer.html?status=${s}" class="stat-card stat-${s === 'assigned' ? 'pending' : 'verified'}"><span class="stat-value">${n}</span><span class="stat-label">${label}</span></a>`)
      .join('')
  })
  .catch(() => {})

mountReportsTable($('#table'))
