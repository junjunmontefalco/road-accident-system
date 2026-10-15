import TodoPanel from '../../components/TodoPanel'

/**
 * Admin pages still to build. Each one becomes its own file when its owner starts it.
 * Owner of every page here: Vince (the API parts are noted per page).
 */
export function AdminUsers() {
  return (
    <div>
      <h1 className="h3 mb-3">Users</h1>
      <TodoPanel title="User management" owner="Vince (page) + Juliana (API)" requirement="FR-13" items={[
        'Table from GET /users/list.php (already works), filter by role',
        'Add and edit form: POST /users/save.php (Juliana)',
        'Activate or deactivate an account',
      ]} />
    </div>
  )
}

export function AdminCategories() {
  return (
    <div>
      <h1 className="h3 mb-3">Categories and settings</h1>
      <TodoPanel title="Accident categories and system settings" owner="Vince (page) + Juliana (API)" items={[
        'List from GET /accident-types/list.php?all=1 (already works)',
        'Add, rename, deactivate: POST /accident-types/save.php (Juliana)',
        'Emergency contacts and settings table (optional)',
      ]} />
    </div>
  )
}

export function AdminAudit() {
  return (
    <div>
      <h1 className="h3 mb-3">Audit trail</h1>
      <TodoPanel title="Audit log viewer" owner="Vince (page) + Juliana (filters)" requirement="FR-14" items={[
        'Table from GET /audit/list.php (latest 100 already works)',
        'Filters by action, user and date',
      ]} />
    </div>
  )
}

export function AdminSummaries() {
  return (
    <div>
      <h1 className="h3 mb-3">Summaries and export</h1>
      <TodoPanel title="Daily, weekly, monthly and annual summaries" owner="Vince" requirement="FR-12" items={[
        'API: api/dashboard/report-summary.php (hints are in that file)',
        'Period picker + date range, table of counts per period',
      ]} />
      <div className="mt-3" />
      <TodoPanel title="Export to PDF and CSV" owner="John" requirement="FR-15" items={[
        'API: api/export/reports.php (hints are in that file)',
        'Download buttons that open the export URL with ?format=csv or pdf&token=...',
      ]} />
    </div>
  )
}
