// FR-07, FR-11 report management. Owner: Vince
import { startPage } from '../app.js'
import { mountReportsTable } from '../reports-table.js'
import { $ } from '../ui.js'

await startPage({ roles: ['admin'] })
mountReportsTable($('#table'))
