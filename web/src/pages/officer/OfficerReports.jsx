import ReportsTable from '../../components/ReportsTable'
import TodoPanel from '../../components/TodoPanel'

/** Officer portal: reports assigned to me. Owner: Jan Russel */
export default function OfficerReports() {
  return (
    <div>
      <h1 className="h3 mb-3">Assigned reports</h1>
      <ReportsTable />
      <div className="mt-4" />
      <TodoPanel title="Officer portal" owner="Jan Russel" items={[
        'Status updates (Assigned to In Progress to Resolved) already work on the report page',
        'Add remarks, findings and actions taken (needs api/reports/add-remark.php from Juliana)',
        'Optional: a simpler card view for officers on phones',
      ]} />
    </div>
  )
}
